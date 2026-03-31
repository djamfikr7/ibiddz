import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { Prisma } from '@prisma/client';

export interface TrustBreakdown {
  score: number;
  tier: string;
  badge: string;
  color: string;
  components: {
    reviewRating: number;
    codCompletion: number;
    disputePenalty: number;
    verificationBonus: number;
    accountAgeFactor: number;
  };
  nextTierScore: number;
  nextTierName: string;
}

@Injectable()
export class TrustService {
  private readonly logger = new Logger(TrustService.name);
  private readonly CACHE_TTL = 3600;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getTrustScore(userId: string): Promise<TrustBreakdown> {
    const cacheKey = `trust:score:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const breakdown = await this.calculateTrustScore(userId);
    await this.redis.set(cacheKey, JSON.stringify(breakdown), 'EX', this.CACHE_TTL);
    return breakdown;
  }

  async calculateTrustScore(userId: string): Promise<TrustBreakdown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        reviewsAsTarget: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const components = await this.calculateComponents(userId, user);
    const score = this.computeScore(components);
    const tier = this.assignTier(score);
    const { nextTierScore, nextTierName } = this.getNextTier(score);

    const breakdown: TrustBreakdown = {
      score,
      tier: tier.name,
      badge: tier.badge,
      color: tier.color,
      components,
      nextTierScore,
      nextTierName,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: score },
    });

    return breakdown;
  }

  private async calculateComponents(
    userId: string,
    user: any,
  ): Promise<TrustBreakdown['components']> {
    const reviewRating = await this.getReviewRating(userId);
    const codCompletion = await this.getCodCompletionRate(userId);
    const disputePenalty = await this.getDisputePenalty(userId);
    const verificationBonus = this.getVerificationBonus(user);
    const accountAgeFactor = this.getAccountAgeFactor(user.createdAt);

    return {
      reviewRating,
      codCompletion,
      disputePenalty,
      verificationBonus,
      accountAgeFactor,
    };
  }

  private async getReviewRating(userId: string): Promise<number> {
    const reviews = await this.prisma.review.findMany({
      where: { targetId: userId, flagged: false },
      select: { rating: true },
    });

    if (reviews.length === 0) return 50;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return (avgRating / 5) * 100;
  }

  private async getCodCompletionRate(userId: string): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: { sellerId: userId },
      select: { status: true, paymentMethod: true },
    });

    const codOrders = orders.filter((o) => o.paymentMethod === 'COD');
    if (codOrders.length === 0) return 50;

    const completed = codOrders.filter((o) =>
      ['DELIVERED', 'PAID'].includes(o.status),
    ).length;

    return (completed / codOrders.length) * 100;
  }

  private async getDisputePenalty(userId: string): Promise<number> {
    const disputes = await this.prisma.dispute.count({
      where: {
        targetId: userId,
        status: { in: ['RESOLVED', 'ESCALATED'] },
        resolution: { in: ['BUYER_FAVOR', 'FULL_REFUND', 'PARTIAL_REFUND'] },
      },
    });

    return disputes * 15;
  }

  private getVerificationBonus(user: any): number {
    let bonus = 0;
    if (user.phoneVerified) bonus += 10;
    if (user.cnieVerified) bonus += 10;
    return Math.min(bonus, 20);
  }

  private getAccountAgeFactor(createdAt: Date): number {
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(20, Math.floor(ageInDays / 30) * 2);
  }

  private computeScore(components: TrustBreakdown['components']): number {
    const { reviewRating, codCompletion, disputePenalty, verificationBonus, accountAgeFactor } =
      components;

    const score =
      0.35 * reviewRating +
      0.25 * codCompletion -
      0.2 * disputePenalty +
      0.1 * verificationBonus +
      0.1 * accountAgeFactor;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private assignTier(score: number): { name: string; badge: string; color: string } {
    if (score >= 88) return { name: 'ELITE', badge: '👑 Elite Seller', color: '#FFD700' };
    if (score >= 75) return { name: 'TRUSTED', badge: '✅ Trusted Seller', color: '#4CAF50' };
    if (score >= 60) return { name: 'ACTIVE', badge: '🟢 Active Seller', color: '#2196F3' };
    return { name: 'NEW', badge: '🆕 New Seller', color: '#9E9E9E' };
  }

  private getNextTier(score: number): { nextTierScore: number; nextTierName: string } {
    if (score < 60) return { nextTierScore: 60, nextTierName: 'ACTIVE' };
    if (score < 75) return { nextTierScore: 75, nextTierName: 'TRUSTED' };
    if (score < 88) return { nextTierScore: 88, nextTierName: 'ELITE' };
    return { nextTierScore: 100, nextTierName: 'MAX TIER' };
  }

  async invalidateCache(userId: string): Promise<void> {
    await this.redis.del(`trust:score:${userId}`);
  }

  async onReviewSubmitted(userId: string): Promise<TrustBreakdown> {
    await this.invalidateCache(userId);
    return this.calculateTrustScore(userId);
  }

  async onDeliveryCompleted(userId: string): Promise<TrustBreakdown> {
    await this.invalidateCache(userId);
    return this.calculateTrustScore(userId);
  }

  async onDisputeResolved(userId: string): Promise<TrustBreakdown> {
    await this.invalidateCache(userId);
    return this.calculateTrustScore(userId);
  }

  async detectCollusion(userId: string): Promise<boolean> {
    const reviews = await this.prisma.review.findMany({
      where: { targetId: userId, rating: 5 },
      include: { reviewer: true },
    });

    const fiveStarReviewers = reviews.map((r) => r.reviewerId);
    const crossReviews = await this.prisma.review.findMany({
      where: {
        reviewerId: { in: fiveStarReviewers },
        targetId: { in: fiveStarReviewers },
        rating: 5,
      },
    });

    return crossReviews.length > 0;
  }
}
