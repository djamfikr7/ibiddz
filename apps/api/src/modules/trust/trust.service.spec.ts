import { Test, TestingModule } from '@nestjs/testing';
import { TrustService, TrustBreakdown } from './trust.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  review: {
    findMany: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
  dispute: {
    count: jest.fn(),
  },
};

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('TrustService', () => {
  let service: TrustService;
  let prisma: typeof mockPrismaService;
  let redis: typeof mockRedisService;

  const baseUser = {
    id: 'user-1',
    phoneVerified: false,
    cnieVerified: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    trustScore: 0,
    reviewsAsTarget: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrustService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<TrustService>(TrustService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
  });

  describe('getTrustScore', () => {
    it('should return cached trust score when available', async () => {
      const cachedBreakdown: TrustBreakdown = {
        score: 72,
        tier: 'ACTIVE',
        badge: '🟢 Active Seller',
        color: '#2196F3',
        components: {
          reviewRating: 80,
          codCompletion: 70,
          disputePenalty: 0,
          verificationBonus: 10,
          accountAgeFactor: 2,
        },
        nextTierScore: 75,
        nextTierName: 'TRUSTED',
      };
      redis.get.mockResolvedValue(JSON.stringify(cachedBreakdown));

      const result = await service.getTrustScore('user-1');

      expect(result).toEqual(cachedBreakdown);
      expect(redis.get).toHaveBeenCalledWith('trust:score:user-1');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should calculate and cache trust score when not cached', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({ ...baseUser, trustScore: 45 });

      const result = await service.getTrustScore('user-1');

      expect(result.score).toBe(45);
      expect(redis.set).toHaveBeenCalledWith(
        'trust:score:user-1',
        expect.any(String),
        'EX',
        3600,
      );
    });
  });

  describe('calculateTrustScore', () => {
    it('should throw error when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.calculateTrustScore('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });

    it('should calculate score with default values for new user', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.score).toBe(45);
      expect(result.tier).toBe('NEW');
      expect(result.components.reviewRating).toBe(50);
      expect(result.components.codCompletion).toBe(50);
      expect(result.components.disputePenalty).toBe(0);
      expect(result.components.verificationBonus).toBe(0);
      expect(result.components.accountAgeFactor).toBe(2);
    });

    it('should update user trust score in database', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      await service.calculateTrustScore('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { trustScore: 45 },
      });
    });
  });

  describe('computeScore formula', () => {
    it('should apply correct weights: 0.35*R + 0.25*C - 0.20*D + 0.10*V + 0.10*A', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 4 },
        { rating: 5 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'CANCELLED', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(1);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      const R = ((4 + 5) / 2 / 5) * 100;
      const C = (2 / 3) * 100;
      const D = 1 * 15;
      const V = 0;
      const A = 2;

      const expected = Math.round(
        Math.min(100, Math.max(0, 0.35 * R + 0.25 * C - 0.2 * D + 0.1 * V + 0.1 * A)),
      );

      expect(result.score).toBe(expected);
    });

    it('should clamp score to maximum of 100', async () => {
      const perfectUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: true,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(perfectUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should clamp score to minimum of 0', async () => {
      const badUser = {
        ...baseUser,
        createdAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(badUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 1 },
        { rating: 1 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'CANCELLED', paymentMethod: 'COD' },
        { status: 'CANCELLED', paymentMethod: 'COD' },
        { status: 'CANCELLED', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(10);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('tier assignment', () => {
    it('should assign NEW tier for score 0-59', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.tier).toBe('NEW');
      expect(result.badge).toBe('🆕 New Seller');
      expect(result.color).toBe('#9E9E9E');
    });

    it('should assign ACTIVE tier for score 60-74', async () => {
      const activeUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: true,
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 4 },
        { rating: 4 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.tier).toBe('ACTIVE');
      expect(result.badge).toBe('🟢 Active Seller');
      expect(result.color).toBe('#2196F3');
    });

    it('should assign TRUSTED tier for score 75-87', async () => {
      const trustedUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: true,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(trustedUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 5 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.tier).toBe('TRUSTED');
      expect(result.badge).toBe('✅ Trusted Seller');
      expect(result.color).toBe('#4CAF50');
    });

    it('should assign ELITE tier for score 88-100', async () => {
      const eliteUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: true,
        createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(eliteUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.score).toBeGreaterThanOrEqual(88);
      expect(result.tier).toBe('ELITE');
      expect(result.badge).toBe('👑 Elite Seller');
      expect(result.color).toBe('#FFD700');
    });
  });

  describe('boundary conditions', () => {
    it('should handle all zeros (worst case)', async () => {
      const worstUser = {
        ...baseUser,
        phoneVerified: false,
        cnieVerified: false,
        createdAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(worstUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      const R = 50;
      const C = 50;
      const D = 0;
      const V = 0;
      const A = 0;
      const expected = Math.round(0.35 * R + 0.25 * C - 0.2 * D + 0.1 * V + 0.1 * A);

      expect(result.score).toBe(expected);
      expect(result.score).toBe(30);
    });

    it('should handle theoretical maximum (best case)', async () => {
      const bestUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: true,
        createdAt: new Date(Date.now() - 3650 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(bestUser);
      prisma.review.findMany.mockResolvedValue([{ rating: 5 }]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('dispute penalty', () => {
    it('should apply D * 15 penalty per dispute', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(3);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.disputePenalty).toBe(45);
    });

    it('should have zero penalty with no disputes', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.disputePenalty).toBe(0);
    });

    it('should significantly reduce score with many disputes', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 5 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(5);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.disputePenalty).toBe(75);
      expect(result.score).toBeLessThan(50);
    });
  });

  describe('verification bonus', () => {
    it('should give 0 bonus with no verification', async () => {
      const unverifiedUser = {
        ...baseUser,
        phoneVerified: false,
        cnieVerified: false,
      };
      prisma.user.findUnique.mockResolvedValue(unverifiedUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.verificationBonus).toBe(0);
    });

    it('should give 10 bonus with phone verified only', async () => {
      const phoneVerifiedUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: false,
      };
      prisma.user.findUnique.mockResolvedValue(phoneVerifiedUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.verificationBonus).toBe(10);
    });

    it('should give 10 bonus with CNIE verified only', async () => {
      const cnieVerifiedUser = {
        ...baseUser,
        phoneVerified: false,
        cnieVerified: true,
      };
      prisma.user.findUnique.mockResolvedValue(cnieVerifiedUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.verificationBonus).toBe(10);
    });

    it('should give 20 bonus with both verifications', async () => {
      const fullyVerifiedUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: true,
      };
      prisma.user.findUnique.mockResolvedValue(fullyVerifiedUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.verificationBonus).toBe(20);
    });
  });

  describe('account age factor', () => {
    it('should give 0 for brand new account', async () => {
      const newUser = {
        ...baseUser,
        createdAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(newUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.accountAgeFactor).toBe(0);
    });

    it('should give 2 for 1-2 months old account', async () => {
      const oneMonthUser = {
        ...baseUser,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(oneMonthUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.accountAgeFactor).toBe(2);
    });

    it('should give 20 for 10+ months old account', async () => {
      const oldUser = {
        ...baseUser,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(oldUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.accountAgeFactor).toBe(20);
    });

    it('should cap at 20 regardless of age', async () => {
      const ancientUser = {
        ...baseUser,
        createdAt: new Date(Date.now() - 3650 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(ancientUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.components.accountAgeFactor).toBe(20);
    });
  });

  describe('next tier information', () => {
    it('should show ACTIVE as next tier for NEW users', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      expect(result.nextTierName).toBe('ACTIVE');
      expect(result.nextTierScore).toBe(60);
    });

    it('should show TRUSTED as next tier for ACTIVE users', async () => {
      const activeUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: true,
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 4 },
        { rating: 4 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      if (result.tier === 'ACTIVE') {
        expect(result.nextTierName).toBe('TRUSTED');
        expect(result.nextTierScore).toBe(75);
      }
    });

    it('should show ELITE as next tier for TRUSTED users', async () => {
      const trustedUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: true,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(trustedUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 5 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      if (result.tier === 'TRUSTED') {
        expect(result.nextTierName).toBe('ELITE');
        expect(result.nextTierScore).toBe(88);
      }
    });

    it('should show MAX TIER for ELITE users', async () => {
      const eliteUser = {
        ...baseUser,
        phoneVerified: true,
        cnieVerified: true,
        createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(eliteUser);
      prisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
      ]);
      prisma.order.findMany.mockResolvedValue([
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
        { status: 'PAID', paymentMethod: 'COD' },
        { status: 'DELIVERED', paymentMethod: 'COD' },
      ]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      const result = await service.calculateTrustScore('user-1');

      if (result.tier === 'ELITE') {
        expect(result.nextTierName).toBe('MAX TIER');
        expect(result.nextTierScore).toBe(100);
      }
    });
  });

  describe('cache invalidation', () => {
    it('should delete cache key on invalidate', async () => {
      await service.invalidateCache('user-1');

      expect(redis.del).toHaveBeenCalledWith('trust:score:user-1');
    });
  });

  describe('event handlers', () => {
    it('should invalidate cache and recalculate on review submitted', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      await service.onReviewSubmitted('user-1');

      expect(redis.del).toHaveBeenCalledWith('trust:score:user-1');
      expect(prisma.user.findUnique).toHaveBeenCalled();
    });

    it('should invalidate cache and recalculate on delivery completed', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      await service.onDeliveryCompleted('user-1');

      expect(redis.del).toHaveBeenCalledWith('trust:score:user-1');
    });

    it('should invalidate cache and recalculate on dispute resolved', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.review.findMany.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({});

      await service.onDisputeResolved('user-1');

      expect(redis.del).toHaveBeenCalledWith('trust:score:user-1');
    });
  });

  describe('detectCollusion', () => {
    it('should return false when no cross-reviews exist', async () => {
      prisma.review.findMany
        .mockResolvedValueOnce([
          { reviewerId: 'user-a', targetId: 'user-1', rating: 5, reviewer: { id: 'user-a' } },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.detectCollusion('user-1');

      expect(result).toBe(false);
    });

    it('should return true when collusion pattern detected', async () => {
      prisma.review.findMany
        .mockResolvedValueOnce([
          { reviewerId: 'user-a', targetId: 'user-1', rating: 5, reviewer: { id: 'user-a' } },
          { reviewerId: 'user-b', targetId: 'user-1', rating: 5, reviewer: { id: 'user-b' } },
        ])
        .mockResolvedValueOnce([
          { reviewerId: 'user-a', targetId: 'user-b', rating: 5 },
        ]);

      const result = await service.detectCollusion('user-1');

      expect(result).toBe(true);
    });

    it('should return false when no 5-star reviews', async () => {
      prisma.review.findMany.mockResolvedValueOnce([]);
      prisma.review.findMany.mockResolvedValueOnce([]);

      const result = await service.detectCollusion('user-1');

      expect(result).toBe(false);
    });
  });
});
