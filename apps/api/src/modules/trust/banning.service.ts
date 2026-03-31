import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

export interface BanProgression {
  currentStatus: string;
  nextStatus: string;
  action: string;
  duration: string;
}

export interface AppealResult {
  appealId: string;
  status: string;
  decision?: string;
  decidedAt?: Date;
}

@Injectable()
export class BanningService {
  private readonly logger = new Logger(BanningService.name);
  private readonly PHONE_SALT: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.PHONE_SALT = this.configService.get<string>('PHONE_HASH_SALT', 'ibiddz_default_salt_2024');
  }

  async escalateBan(userId: string): Promise<BanProgression> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let progression: BanProgression;

    switch (user.banStatus) {
      case 'NONE':
      case 'WARNING':
        progression = {
          currentStatus: user.banStatus,
          nextStatus: 'TEMPORARY',
          action: 'SUSPENSION',
          duration: '30d',
        };
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            banStatus: 'TEMPORARY',
            metadata: {
              ...(user.metadata as Record<string, any>),
              suspensionStart: new Date().toISOString(),
              suspensionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        });
        break;

      case 'TEMPORARY':
        progression = {
          currentStatus: 'TEMPORARY',
          nextStatus: 'PERMANENT',
          action: 'PERMANENT_BAN',
          duration: 'permanent',
        };
        await this.prisma.user.update({
          where: { id: userId },
          data: { banStatus: 'PERMANENT' },
        });
        break;

      default:
        progression = {
          currentStatus: user.banStatus,
          nextStatus: user.banStatus,
          action: 'NO_CHANGE',
          duration: 'N/A',
        };
    }

    await this.prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: userId,
        action: progression.action === 'PERMANENT_BAN' ? 'SUSPEND' : 'UPDATE',
        reason: `Ban escalation: ${progression.currentStatus} → ${progression.nextStatus}`,
        metadata: { progression: progression as any },
      },
    });

    return progression;
  }

  hashPhone(phone: string): string {
    return createHash('sha256')
      .update(phone + this.PHONE_SALT)
      .digest('hex');
  }

  async detectEvasion(phone: string, deviceFingerprint?: string): Promise<{
    evasionDetected: boolean;
    matchedUserIds: string[];
    matchType: string;
  }> {
    const hashedPhone = this.hashPhone(phone);
    const matchedUserIds: string[] = [];
    let matchType = 'NONE';

    const phoneMatch = await this.prisma.user.findMany({
      where: {
        phone: { not: phone },
        metadata: { path: ['hashedPhone'], equals: hashedPhone },
        banStatus: { in: ['TEMPORARY', 'PERMANENT'] },
      },
      select: { id: true },
    });

    if (phoneMatch.length > 0) {
      matchedUserIds.push(...phoneMatch.map((u) => u.id));
      matchType = 'PHONE_HASH';
    }

    if (deviceFingerprint) {
      const deviceMatch = await this.prisma.user.findMany({
        where: {
          OR: [{ deviceFingerprint }, { lastDeviceFingerprint: deviceFingerprint }],
          banStatus: { in: ['TEMPORARY', 'PERMANENT'] },
        },
        select: { id: true },
      });

      if (deviceMatch.length > 0) {
        matchedUserIds.push(...deviceMatch.map((u) => u.id));
        matchType = matchType === 'PHONE_HASH' ? 'BOTH' : 'DEVICE_FINGERPRINT';
      }
    }

    return {
      evasionDetected: matchedUserIds.length > 0,
      matchedUserIds,
      matchType,
    };
  }

  async submitAppeal(
    userId: string,
    reason: string,
  ): Promise<{ appealId: string; status: string; deadline: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.banStatus === 'NONE') {
      throw new BadRequestException('No active ban to appeal');
    }

    const metadata = (user.metadata as Record<string, any>) || {};
    const lastAppeal = metadata.lastAppealAt
      ? new Date(metadata.lastAppealAt)
      : null;

    if (lastAppeal) {
      const daysSinceAppeal =
        (Date.now() - lastAppeal.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceAppeal < 7) {
        throw new BadRequestException('Appeal window is 7 days. Please wait before submitting another appeal.');
      }
    }

    const appeal = await this.prisma.auditLog.create({
      data: {
        entityType: 'BanAppeal',
        entityId: userId,
        action: 'UPDATE',
        reason: `Ban appeal submitted: ${reason}`,
        metadata: {
          type: 'BAN_APPEAL',
          status: 'PENDING',
          submittedAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        },
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...metadata,
          lastAppealAt: new Date().toISOString(),
          pendingAppealId: appeal.id,
        },
      },
    });

    return {
      appealId: appeal.id,
      status: 'PENDING',
      deadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
    };
  }

  async resolveAppeal(
    appealId: string,
    approved: boolean,
    adminId: string,
    notes?: string,
  ): Promise<AppealResult> {
    const appeal = await this.prisma.auditLog.findUnique({
      where: { id: appealId },
    });

    if (!appeal || (appeal.metadata as any)?.type !== 'BAN_APPEAL') {
      throw new BadRequestException('Invalid appeal ID');
    }

    const userId = appeal.entityId;
    const decision = approved ? 'APPROVED' : 'REJECTED';

    await this.prisma.auditLog.update({
      where: { id: appealId },
      data: {
        action: approved ? 'UNSUSPEND' : 'UPDATE',
        reason: `Appeal ${decision.toLowerCase()}: ${notes || 'No notes'}`,
        metadata: {
          ...(appeal.metadata as Record<string, any>),
          status: decision,
          decidedAt: new Date().toISOString(),
          adminId,
          notes,
        },
      },
    });

    if (approved) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          banStatus: 'NONE',
          metadata: {
            ...((await this.prisma.user.findUnique({ where: { id: userId } }))
              ?.metadata as Record<string, any>),
            pendingAppealId: null,
            appealHistory: [
              ...(((await this.prisma.user.findUnique({ where: { id: userId } }))
                ?.metadata as Record<string, any>)?.appealHistory || []),
              { appealId, decision, decidedAt: new Date().toISOString() },
            ],
          },
        },
      });
    } else {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...((user?.metadata as Record<string, any>) || {}),
            pendingAppealId: null,
            appealHistory: [
              ...(((user?.metadata as Record<string, any>)?.appealHistory || [])),
              { appealId, decision, decidedAt: new Date().toISOString() },
            ],
          },
        },
      });
    }

    return {
      appealId,
      status: decision,
      decision: notes,
      decidedAt: new Date(),
    };
  }

  async getBanStatus(userId: string): Promise<{
    status: string;
    suspensionEnd?: Date;
    canAppeal: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const metadata = (user.metadata as Record<string, any>) || {};
    const suspensionEnd = metadata.suspensionEnd
      ? new Date(metadata.suspensionEnd)
      : undefined;

    const lastAppeal = metadata.lastAppealAt
      ? new Date(metadata.lastAppealAt)
      : null;
    const canAppeal =
      user.banStatus !== 'NONE' &&
      (!lastAppeal ||
        (Date.now() - lastAppeal.getTime()) / (1000 * 60 * 60 * 24) >= 7);

    return {
      status: user.banStatus,
      suspensionEnd,
      canAppeal,
    };
  }
}
