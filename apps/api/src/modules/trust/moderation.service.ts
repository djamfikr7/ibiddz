import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

const FLAGGED_KEYWORDS = [
  'contrefaçon',
  'clone',
  'débloqué illégal',
  'debloque illegal',
  'faux',
  'copie',
  'reconditionné non officiel',
  'imei change',
  'imei modifié',
  'volé',
  'stolen',
  'blacklist',
  'banni icloud',
  'bypass icloud',
];

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async moderateListing(listingId: string): Promise<{
    status: string;
    flags: string[];
    requiresManualReview: boolean;
  }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    const flags: string[] = [];
    const textContent = `${listing.title} ${listing.description}`.toLowerCase();

    const keywordFlags = this.checkKeywords(textContent);
    if (keywordFlags.length > 0) {
      flags.push(...keywordFlags);
    }

    const imageFlags = await this.checkImageDuplicates(listingId, listing.photos as string[]);
    if (imageFlags.length > 0) {
      flags.push(...imageFlags);
    }

    const trustScore = listing.seller.trustScore;
    const requiresManualReview =
      trustScore < 60 || flags.length > 0;

    if (requiresManualReview) {
      await this.prisma.moderationQueue.create({
        data: {
          listingId,
          userId: listing.sellerId,
          reason: flags.length > 0
            ? `Flagged keywords: ${flags.join(', ')}`
            : 'Low trust score seller',
          category: flags.length > 0 ? 'COUNTERFEIT' : 'OTHER',
          description: `Auto-flagged for manual review. Trust score: ${trustScore}`,
          status: 'PENDING',
        },
      });
    }

    return {
      status: requiresManualReview ? 'PENDING_REVIEW' : 'APPROVED',
      flags,
      requiresManualReview,
    };
  }

  private checkKeywords(text: string): string[] {
    return FLAGGED_KEYWORDS.filter((keyword) => text.includes(keyword.toLowerCase()));
  }

  async checkImageDuplicates(
    listingId: string,
    photos: string[],
  ): Promise<string[]> {
    const flags: string[] = [];

    for (const photoUrl of photos) {
      const hash = await this.computePHash(photoUrl);
      const existing = await this.redis.get(`image:hash:${hash}`);
      if (existing) {
        flags.push(`Duplicate image detected (hash: ${hash})`);
      } else {
        await this.redis.set(`image:hash:${hash}`, listingId, 'EX', 86400 * 30);
      }
    }

    return flags;
  }

  private async computePHash(_url: string): Promise<string> {
    return 'stub_hash_placeholder';
  }

  async checkBounceRate(userId: string): Promise<{
    shouldMute: boolean;
    bounceRate: number;
  }> {
    const broadcasts = await this.prisma.broadcast.findMany({
      where: { senderId: userId },
      select: { sentCount: true, deliveredCount: true },
    });

    if (broadcasts.length === 0) {
      return { shouldMute: false, bounceRate: 0 };
    }

    const totalSent = broadcasts.reduce((sum, b) => sum + b.sentCount, 0);
    const totalDelivered = broadcasts.reduce((sum, b) => sum + b.deliveredCount, 0);

    if (totalSent === 0) {
      return { shouldMute: false, bounceRate: 0 };
    }

    const bounceRate = ((totalSent - totalDelivered) / totalSent) * 100;
    const shouldMute = bounceRate > 15;

    if (shouldMute) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...(await this.getUserMetadata(userId)),
            muted: true,
            mutedReason: `High bounce rate: ${bounceRate.toFixed(1)}%`,
            mutedAt: new Date().toISOString(),
          },
        },
      });
    }

    return { shouldMute, bounceRate };
  }

  private async getUserMetadata(userId: string): Promise<Record<string, any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    return (user?.metadata as Record<string, any>) || {};
  }

  async enforceStrikePolicy(userId: string): Promise<{
    action: string;
    strikeCount: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const strikeCount = user.strikeCount;
    let action = 'NONE';

    if (strikeCount >= 3) {
      action = 'PERMANENT_BAN';
      await this.prisma.user.update({
        where: { id: userId },
        data: { banStatus: 'PERMANENT' },
      });
    } else if (strikeCount === 2) {
      action = 'SUSPENSION';
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          banStatus: 'TEMPORARY',
          metadata: {
            ...(await this.getUserMetadata(userId)),
            suspensionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      });
    } else if (strikeCount === 1) {
      action = 'WARNING';
      await this.prisma.user.update({
        where: { id: userId },
        data: { banStatus: 'WARNING' },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: userId,
        action: strikeCount >= 3 ? 'SUSPEND' : 'UPDATE',
        reason: `Strike policy enforcement: ${strikeCount} strikes`,
        metadata: { strikeCount, action },
      },
    });

    return { action, strikeCount };
  }

  async addStrike(userId: string, reason: string): Promise<number> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { strikeCount: { increment: 1 } },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: userId,
        action: 'UPDATE',
        reason,
        metadata: { newStrikeCount: user.strikeCount },
      },
    });

    return user.strikeCount;
  }
}
