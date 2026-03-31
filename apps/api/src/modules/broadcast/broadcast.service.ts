import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../../common/services/prisma.service";
import { Prisma } from "@prisma/client";
import { RedisService } from "../../common/services/redis.service";
import { CreateBroadcastDto } from "./dto/create-broadcast.dto";
import { BroadcastResponseDto } from "./dto/broadcast-response.dto";
import { BROADCAST_CREDITS } from "@ibiddz/shared";
import { createHash } from "crypto";

const TIER_PRICING: Record<string, number> = {
  BASICO: 120,
  PRO: 120,
  CERTIFIE: 90,
  ELITE: 70,
};

const MAX_BROADCASTS_LOW_TRUST = 5;
const COOLDOWN_HOURS = 4;
const TRUST_THRESHOLD = 88;

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue("broadcast-queue")
    private readonly broadcastQueue: Queue,
  ) {}

  async create(
    userId: string,
    dto: CreateBroadcastDto,
  ): Promise<BroadcastResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    const role = user.role as keyof typeof BROADCAST_CREDITS;
    const tierConfig = BROADCAST_CREDITS[role];

    if (!tierConfig) {
      throw new HttpException(
        "Invalid user role for broadcasts",
        HttpStatus.FORBIDDEN,
      );
    }

    const todayCount = await this.getTodayBroadcastCount(userId);
    const maxPerDay =
      user.trustScore < TRUST_THRESHOLD
        ? MAX_BROADCASTS_LOW_TRUST
        : tierConfig.maxPerDay;

    if (todayCount >= maxPerDay) {
      throw new HttpException(
        `Daily broadcast limit reached (${todayCount}/${maxPerDay})`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const cooldownKey = `broadcast:cooldown:${userId}`;
    const lastBroadcast = await this.redis.get(cooldownKey);
    if (lastBroadcast) {
      const elapsed = Date.now() - parseInt(lastBroadcast, 10);
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil(
          (cooldownMs - elapsed) / (60 * 1000),
        );
        throw new HttpException(
          `Cooldown active. Try again in ${remaining} minutes`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const contentHash = this.hashContent(dto.title, dto.content);
    const duplicateKey = `broadcast:hash:${userId}:${contentHash}`;
    const isDuplicate = await this.redis.get(duplicateKey);
    if (isDuplicate) {
      throw new HttpException(
        "Duplicate broadcast content detected",
        HttpStatus.BAD_REQUEST,
      );
    }

    const creditCost = this.calculateCreditCost(user.trustScore, role);

    if (user.broadcastCredits < creditCost) {
      throw new HttpException(
        `Insufficient broadcast credits. Need ${creditCost}, have ${user.broadcastCredits}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const audienceFilter = dto.audienceFilter || undefined;

    const broadcast = await this.prisma.broadcast.create({
      data: {
        senderId: userId,
        channel: dto.channel as any,
        status: "SCHEDULED",
        audienceType: dto.audienceType,
        audienceFilter: audienceFilter as any,
        recipientIds: dto.recipientIds ? (dto.recipientIds as any) : Prisma.JsonNull,
        title: dto.title,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        actionUrl: dto.actionUrl,
        creditCost,
        creditsDeducted: false,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        broadcastCredits: {
          decrement: creditCost,
        },
      },
    });

    await this.prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { creditsDeducted: true },
    });

    await this.redis.set(cooldownKey, Date.now().toString(), "EX", COOLDOWN_HOURS * 3600);
    await this.redis.set(duplicateKey, "1", "EX", 86400);

    const incrementKey = `broadcast:daily:${userId}:${this.getTodayKey()}`;
    await this.redis.incr(incrementKey);
    await this.redis.expire(incrementKey, 86400);

    const recipients = await this.resolveAudience(
      userId,
      dto.audienceType,
      audienceFilter as Record<string, unknown> | null,
      dto.recipientIds,
    );

    if (recipients.length === 0) {
      await this.prisma.broadcast.update({
        where: { id: broadcast.id },
        data: { status: "CANCELLED" },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          broadcastCredits: {
            increment: creditCost,
          },
        },
      });
      throw new HttpException(
        "No recipients matched the audience criteria",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.broadcastQueue.add(
      "broadcast:deliver",
      {
        broadcastId: broadcast.id,
        recipientIds: recipients,
        channel: dto.channel,
        title: dto.title,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        actionUrl: dto.actionUrl,
      },
      {
        delay: dto.scheduledAt
          ? new Date(dto.scheduledAt).getTime() - Date.now()
          : 0,
        jobId: `broadcast:${broadcast.id}`,
      },
    );

    this.logger.log(
      `Broadcast ${broadcast.id} created for ${recipients.length} recipients, cost: ${creditCost} credits`,
    );

    return this.mapToResponse(broadcast);
  }

  async getMyBroadcasts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ data: BroadcastResponseDto[]; meta: { total: number; hasMore: boolean; cursor: string | null } }> {
    const where = { senderId: userId };
    const take = Math.min(Math.max(limit, 1), 100);

    const broadcasts = await this.prisma.broadcast.findMany({
      where,
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    const hasMore = broadcasts.length > take;
    if (hasMore) {
      broadcasts.pop();
    }

    const total = await this.prisma.broadcast.count({ where });
    const nextCursor = hasMore && broadcasts.length > 0
      ? broadcasts[broadcasts.length - 1].id
      : null;

    return {
      data: broadcasts.map((b) => this.mapToResponse(b)),
      meta: {
        total,
        hasMore,
        cursor: nextCursor,
      },
    };
  }

  async getAnalytics(broadcastId: string, userId: string): Promise<BroadcastResponseDto> {
    const broadcast = await this.prisma.broadcast.findFirst({
      where: {
        id: broadcastId,
        senderId: userId,
      },
      include: {
        analytics: true,
      },
    });

    if (!broadcast) {
      throw new HttpException("Broadcast not found", HttpStatus.NOT_FOUND);
    }

    return this.mapToResponse(broadcast);
  }

  async cancel(broadcastId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const broadcast = await this.prisma.broadcast.findFirst({
      where: {
        id: broadcastId,
        senderId: userId,
      },
    });

    if (!broadcast) {
      throw new HttpException("Broadcast not found", HttpStatus.NOT_FOUND);
    }

    if (broadcast.status !== "SCHEDULED" && broadcast.status !== "DRAFT") {
      throw new HttpException(
        "Can only cancel broadcasts in DRAFT or SCHEDULED status",
        HttpStatus.BAD_REQUEST,
      );
    }

    const job = await this.broadcastQueue.getJob(`broadcast:${broadcastId}`);
    if (job) {
      await job.remove();
    }

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: "CANCELLED" },
    });

    if (broadcast.creditsDeducted) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          broadcastCredits: {
            increment: broadcast.creditCost,
          },
        },
      });

      await this.prisma.broadcast.update({
        where: { id: broadcastId },
        data: { creditsDeducted: false },
      });
    }

    this.logger.log(`Broadcast ${broadcastId} cancelled, credits refunded`);

    return {
      success: true,
      message: "Broadcast cancelled and credits refunded",
    };
  }

  private calculateCreditCost(trustScore: number, role: string): number {
    const baseCost = TIER_PRICING[role] || 120;

    const trustDiscount = 0.005 * Math.max(0, trustScore - 60);
    const discountedCost = Math.round(150 * (1 - trustDiscount));

    return Math.min(baseCost, Math.max(discountedCost, 10));
  }

  private async getTodayBroadcastCount(userId: string): Promise<number> {
    const key = `broadcast:daily:${userId}:${this.getTodayKey()}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  private getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  private hashContent(title: string, content: string): string {
    return createHash("sha256")
      .update(`${title.trim().toLowerCase()}:${content.trim().toLowerCase()}`)
      .digest("hex")
      .substring(0, 16);
  }

  private async resolveAudience(
    senderId: string,
    audienceType: string,
    audienceFilter: Record<string, unknown> | null,
    recipientIds?: string[],
  ): Promise<string[]> {
    if (recipientIds && recipientIds.length > 0) {
      return recipientIds;
    }

    switch (audienceType.toUpperCase()) {
      case "FOLLOWERS": {
        const followers = await this.prisma.follow.findMany({
          where: { followingId: senderId },
          select: { followerId: true },
        });
        return followers.map((f) => f.followerId);
      }

      case "WATCHERS": {
        const listings = await this.prisma.listing.findMany({
          where: { sellerId: senderId },
          select: { id: true },
        });
        const listingIds = listings.map((l) => l.id);
        if (listingIds.length === 0) return [];

        const watchers = await this.prisma.bid.findMany({
          where: { listingId: { in: listingIds } },
          select: { userId: true },
          distinct: ["userId"],
        });
        return watchers.map((w) => w.userId).filter((id) => id !== senderId);
      }

      case "WISHLIST": {
        const listings = await this.prisma.listing.findMany({
          where: { sellerId: senderId },
          select: { id: true, model: true },
        });
        if (listings.length === 0) return [];

        const models = listings.map((l) => l.model);
        const wishlistUsers = await this.prisma.bid.findMany({
          where: {
            listing: {
              model: { in: models },
            },
          },
          select: { userId: true },
          distinct: ["userId"],
        });
        return wishlistUsers.map((u) => u.userId).filter((id) => id !== senderId);
      }

      case "ALL": {
        const users = await this.prisma.user.findMany({
          select: { id: true },
          take: 10000,
        });
        return users.map((u) => u.id).filter((id) => id !== senderId);
      }

      case "CUSTOM": {
        if (!audienceFilter) return [];
        const whereClause: Record<string, unknown> = {};
        if (audienceFilter.role) {
          whereClause.role = audienceFilter.role;
        }
        if (audienceFilter.wilaya) {
          whereClause.metadata = {
            path: ["wilaya"],
            equals: audienceFilter.wilaya,
          };
        }
        if (audienceFilter.trustScoreMin) {
          whereClause.trustScore = {
            gte: Number(audienceFilter.trustScoreMin),
          };
        }
        const users = await this.prisma.user.findMany({
          where: whereClause,
          select: { id: true },
          take: 10000,
        });
        return users.map((u) => u.id).filter((id) => id !== senderId);
      }

      default:
        return [];
    }
  }

  private mapToResponse(broadcast: any): BroadcastResponseDto {
    return {
      id: broadcast.id,
      senderId: broadcast.senderId,
      channel: broadcast.channel,
      status: broadcast.status,
      audienceType: broadcast.audienceType,
      title: broadcast.title,
      content: broadcast.content,
      mediaUrl: broadcast.mediaUrl,
      actionUrl: broadcast.actionUrl,
      creditCost: broadcast.creditCost,
      creditsDeducted: broadcast.creditsDeducted,
      scheduledAt: broadcast.scheduledAt,
      sentAt: broadcast.sentAt,
      sentCount: broadcast.sentCount,
      deliveredCount: broadcast.deliveredCount,
      openedCount: broadcast.openedCount,
      clickedCount: broadcast.clickedCount,
      convertedCount: broadcast.convertedCount,
      createdAt: broadcast.createdAt,
      updatedAt: broadcast.updatedAt,
      analytics: broadcast.analytics
        ? {
            sentCount: broadcast.analytics.reduce(
              (sum: number, a: any) => sum + (a.delivered ? 1 : 0),
              0,
            ),
            deliveredCount: broadcast.deliveredCount,
            openedCount: broadcast.openedCount,
            clickedCount: broadcast.clickedCount,
            convertedCount: broadcast.convertedCount,
            recipients: (broadcast.analytics || []).map((a: any) => ({
              userId: a.userId,
              delivered: a.delivered,
              deliveredAt: a.deliveredAt,
              opened: a.opened,
              openedAt: a.openedAt,
              clicked: a.clicked,
              clickedAt: a.clickedAt,
              converted: a.converted,
              convertedAt: a.convertedAt,
            })),
          }
        : null,
    };
  }
}
