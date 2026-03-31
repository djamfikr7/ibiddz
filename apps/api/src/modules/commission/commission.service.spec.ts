import { Test, TestingModule } from '@nestjs/testing';
import { CommissionService, CommissionEstimate } from './commission.service';
import { PrismaService } from '../../common/services/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

const mockPrismaService = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  commissionLedger: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('CommissionService', () => {
  let service: CommissionService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);
    prisma = module.get(PrismaService);
  });

  describe('estimateCommission', () => {
    describe('base fee calculation', () => {
      it('should apply 3% rate for medium-priced items', () => {
        const result = service.estimateCommission({
          price: 50000,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.baseFee).toBe(1500);
      });

      it('should enforce minimum fee of 2000 DZD for cheap items', () => {
        const result = service.estimateCommission({
          price: 10000,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.baseFee).toBe(2000);
      });

      it('should use 3% when it exceeds minimum for expensive items', () => {
        const result = service.estimateCommission({
          price: 100000,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.baseFee).toBe(3000);
      });

      it('should calculate correct base fee at minimum threshold boundary', () => {
        const thresholdPrice = 2000 / 0.03;
        const result = service.estimateCommission({
          price: thresholdPrice,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.baseFee).toBe(2000);
      });

      it('should use percentage for price just above threshold', () => {
        const result = service.estimateCommission({
          price: 70000,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.baseFee).toBe(2100);
      });
    });

    describe('tier discounts', () => {
      it('should apply 0% discount for BASICO tier', () => {
        const result = service.estimateCommission({
          price: 50000,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.tierDiscount).toBe(0);
        expect(result.finalCommission).toBe(1500);
      });

      it('should apply 1.5% discount for PRO tier', () => {
        const result = service.estimateCommission({
          price: 50000,
          tier: 'PRO',
          auction: false,
        });

        expect(result.tierDiscount).toBe(1.5);
        expect(result.finalCommission).toBe(1477.5);
      });

      it('should apply 2% discount for CERTIFIE tier', () => {
        const result = service.estimateCommission({
          price: 50000,
          tier: 'CERTIFIE',
          auction: false,
        });

        expect(result.tierDiscount).toBe(2);
        expect(result.finalCommission).toBe(1470);
      });

      it('should apply 2.5% discount for ELITE tier', () => {
        const result = service.estimateCommission({
          price: 50000,
          tier: 'ELITE',
          auction: false,
        });

        expect(result.tierDiscount).toBe(2.5);
        expect(result.finalCommission).toBe(1462.5);
      });

      it('should throw error for invalid tier', () => {
        expect(() =>
          service.estimateCommission({
            price: 50000,
            tier: 'INVALID',
            auction: false,
          }),
        ).toThrow(BadRequestException);

        expect(() =>
          service.estimateCommission({
            price: 50000,
            tier: 'INVALID',
            auction: false,
          }),
        ).toThrow('Invalid tier: INVALID');
      });
    });

    describe('auction surcharge', () => {
      it('should add 500 DZD surcharge for auction items', () => {
        const result = service.estimateCommission({
          price: 50000,
          tier: 'BASICO',
          auction: true,
        });

        expect(result.auctionSurcharge).toBe(500);
        expect(result.finalCommission).toBe(2000);
      });

      it('should not add surcharge for non-auction items', () => {
        const result = service.estimateCommission({
          price: 50000,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.auctionSurcharge).toBe(0);
        expect(result.isAuction).toBe(false);
      });

      it('should apply surcharge after tier discount', () => {
        const result = service.estimateCommission({
          price: 50000,
          tier: 'ELITE',
          auction: true,
        });

        const discounted = 1500 * (1 - 0.025);
        expect(result.finalCommission).toBe(discounted + 500);
      });

      it('should count surcharge towards cap', () => {
        const result = service.estimateCommission({
          price: 250000,
          tier: 'BASICO',
          auction: true,
        });

        const baseFee = Math.max(0.03 * 250000, 2000);
        const beforeCap = baseFee + 500;
        expect(result.capped).toBe(beforeCap >= 8500);
        expect(result.finalCommission).toBeLessThanOrEqual(8500);
      });
    });

    describe('commission cap', () => {
      it('should cap commission at 8500 DZD', () => {
        const result = service.estimateCommission({
          price: 500000,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.finalCommission).toBe(8500);
        expect(result.capped).toBe(true);
      });

      it('should not cap when below threshold', () => {
        const result = service.estimateCommission({
          price: 50000,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.finalCommission).toBe(1500);
        expect(result.capped).toBe(false);
      });

      it('should cap expensive auction items at 8500 DZD', () => {
        const result = service.estimateCommission({
          price: 1000000,
          tier: 'ELITE',
          auction: true,
        });

        expect(result.finalCommission).toBe(8500);
        expect(result.capped).toBe(true);
      });

      it('should calculate exact cap threshold for BASICO', () => {
        const result = service.estimateCommission({
          price: 283333,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.finalCommission).toBeLessThanOrEqual(8500);
      });
    });

    describe('edge cases', () => {
      it('should throw error for zero price', () => {
        expect(() =>
          service.estimateCommission({
            price: 0,
            tier: 'BASICO',
            auction: false,
          }),
        ).toThrow(BadRequestException);

        expect(() =>
          service.estimateCommission({
            price: 0,
            tier: 'BASICO',
            auction: false,
          }),
        ).toThrow('Price must be greater than 0');
      });

      it('should throw error for negative price', () => {
        expect(() =>
          service.estimateCommission({
            price: -100,
            tier: 'BASICO',
            auction: false,
          }),
        ).toThrow(BadRequestException);
      });

      it('should handle very cheap items with minimum fee', () => {
        const result = service.estimateCommission({
          price: 100,
          tier: 'BASICO',
          auction: false,
        });

        expect(result.baseFee).toBe(2000);
        expect(result.finalCommission).toBe(2000);
        expect(result.netToSeller).toBe(-1900);
      });

      it('should handle very expensive items with cap', () => {
        const result = service.estimateCommission({
          price: 5000000,
          tier: 'ELITE',
          auction: true,
        });

        expect(result.finalCommission).toBe(8500);
        expect(result.capped).toBe(true);
        expect(result.netToSeller).toBe(4991500);
      });

      it('should calculate net to seller correctly', () => {
        const result = service.estimateCommission({
          price: 100000,
          tier: 'PRO',
          auction: false,
        });

        expect(result.netToSeller).toBe(100000 - result.finalCommission);
      });

      it('should round values to 2 decimal places', () => {
        const result = service.estimateCommission({
          price: 33333,
          tier: 'PRO',
          auction: false,
        });

        expect(result.baseFee).toBe(2000);
        expect(Number.isInteger(result.finalCommission * 100)).toBe(true);
      });
    });

    describe('formula verification', () => {
      it('should correctly compute: min(max(0.03*P, 2000) * (1 - M_tier) + Δ_auction, 8500)', () => {
        const price = 80000;
        const tier = 'CERTIFIE';
        const isAuction = true;

        const result = service.estimateCommission({
          price,
          tier,
          auction: isAuction,
        });

        const baseFee = Math.max(0.03 * price, 2000);
        const discounted = baseFee * (1 - 0.02);
        const withSurcharge = discounted + 500;
        const expected = Math.min(withSurcharge, 8500);

        expect(result.finalCommission).toBe(Math.round(expected * 100) / 100);
      });

      it('should verify minimum floor before discount', () => {
        const result = service.estimateCommission({
          price: 5000,
          tier: 'ELITE',
          auction: false,
        });

        const baseFee = Math.max(0.03 * 5000, 2000);
        expect(baseFee).toBe(2000);
        const expected = baseFee * (1 - 0.025);
        expect(result.finalCommission).toBe(Math.round(expected * 100) / 100);
      });
    });

    describe('all tier and price combinations', () => {
      const tiers = ['BASICO', 'PRO', 'CERTIFIE', 'ELITE'];
      const prices = [5000, 20000, 50000, 100000, 300000];

      tiers.forEach((tier) => {
        prices.forEach((price) => {
          it(`should calculate valid commission for ${tier} at ${price} DZD`, () => {
            const result = service.estimateCommission({
              price,
              tier,
              auction: false,
            });

            expect(result.finalCommission).toBeGreaterThanOrEqual(0);
            expect(result.finalCommission).toBeLessThanOrEqual(8500);
            expect(result.netToSeller).toBe(price - result.finalCommission);
          });
        });
      });
    });
  });

  describe('calculateCommission', () => {
    it('should calculate commission from order data', async () => {
      const mockOrder = {
        id: 'order-1',
        finalPrice: new Decimal(50000),
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        status: 'PENDING',
        seller: {
          id: 'seller-1',
          role: 'PRO',
        },
        listing: {
          id: 'listing-1',
          auctionType: 'LIVE',
        },
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.calculateCommission('order-1');

      expect(result.commissionAmount).toBeInstanceOf(Decimal);
      expect(result.platformFee).toBeInstanceOf(Decimal);
      expect(result.netToSeller).toBeInstanceOf(Decimal);
      expect(result.breakdown.salePrice).toBe(50000);
      expect(result.breakdown.tier).toBe('PRO');
    });

    it('should throw error when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.calculateCommission('nonexistent')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle BUY_NOW listing type as non-auction', async () => {
      const mockOrder = {
        id: 'order-1',
        finalPrice: new Decimal(30000),
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        status: 'PENDING',
        seller: {
          id: 'seller-1',
          role: 'BASICO',
        },
        listing: {
          id: 'listing-1',
          auctionType: 'BUY_NOW',
        },
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.calculateCommission('order-1');

      expect(result.breakdown.auctionSurcharge).toBe(0);
    });

    it('should handle LIVE auction type with surcharge', async () => {
      const mockOrder = {
        id: 'order-2',
        finalPrice: new Decimal(30000),
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        status: 'PENDING',
        seller: {
          id: 'seller-1',
          role: 'BASICO',
        },
        listing: {
          id: 'listing-2',
          auctionType: 'LIVE',
        },
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.calculateCommission('order-2');

      expect(result.breakdown.auctionSurcharge).toBe(500);
    });
  });

  describe('createLedgerEntry', () => {
    it('should return existing entry if already exists', async () => {
      const existing = { id: 'ledger-1', orderId: 'order-1', settled: false };
      prisma.commissionLedger.findFirst.mockResolvedValue(existing);

      const result = await service.createLedgerEntry('order-1');

      expect(result).toEqual(existing);
      expect(prisma.commissionLedger.create).not.toHaveBeenCalled();
    });

    it('should create new ledger entry when none exists', async () => {
      prisma.commissionLedger.findFirst.mockResolvedValue(null);

      const mockOrder = {
        id: 'order-1',
        finalPrice: new Decimal(50000),
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        status: 'PENDING',
        seller: {
          id: 'seller-1',
          role: 'PRO',
        },
        listing: {
          id: 'listing-1',
          auctionType: 'LIVE',
        },
      };
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const mockLedger = {
        id: 'ledger-1',
        orderId: 'order-1',
        commissionAmount: new Decimal(1977.5),
        settled: false,
      };
      prisma.commissionLedger.create.mockResolvedValue(mockLedger);
      prisma.order.update.mockResolvedValue({});

      const result = await service.createLedgerEntry('order-1');

      expect(prisma.commissionLedger.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-1',
          settled: false,
        }),
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: expect.objectContaining({
          commissionAmount: expect.any(Decimal),
        }),
      });
    });
  });

  describe('settleCommission', () => {
    it('should mark ledger as settled', async () => {
      const mockLedger = {
        id: 'ledger-1',
        orderId: 'order-1',
        settled: false,
        order: { id: 'order-1' },
      };
      prisma.commissionLedger.findUnique.mockResolvedValue(mockLedger);

      const settledLedger = {
        ...mockLedger,
        settled: true,
        settledAt: expect.any(Date),
        settlementRef: expect.stringMatching(/^SETTLE-/),
      };
      prisma.commissionLedger.update.mockResolvedValue(settledLedger);

      const result = await service.settleCommission('ledger-1');

      expect(prisma.commissionLedger.update).toHaveBeenCalledWith({
        where: { id: 'ledger-1' },
        data: expect.objectContaining({
          settled: true,
          settledAt: expect.any(Date),
          settlementRef: expect.stringMatching(/^SETTLE-/),
        }),
      });
    });

    it('should return existing entry if already settled', async () => {
      const settledLedger = {
        id: 'ledger-1',
        orderId: 'order-1',
        settled: true,
        settledAt: new Date(),
        order: { id: 'order-1' },
      };
      prisma.commissionLedger.findUnique.mockResolvedValue(settledLedger);

      const result = await service.settleCommission('ledger-1');

      expect(result).toEqual(settledLedger);
      expect(prisma.commissionLedger.update).not.toHaveBeenCalled();
    });

    it('should throw error when ledger not found', async () => {
      prisma.commissionLedger.findUnique.mockResolvedValue(null);

      await expect(service.settleCommission('nonexistent')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserLedger', () => {
    it('should return paginated ledger entries', async () => {
      const mockEntries = [
        { id: 'ledger-1', orderId: 'order-1' },
        { id: 'ledger-2', orderId: 'order-2' },
      ];
      prisma.commissionLedger.findMany.mockResolvedValue(mockEntries);
      prisma.commissionLedger.count.mockResolvedValue(25);

      const result = await service.getUserLedger('user-1', 1, 20);

      expect(result.entries).toEqual(mockEntries);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should calculate correct pagination for different page sizes', async () => {
      prisma.commissionLedger.findMany.mockResolvedValue([]);
      prisma.commissionLedger.count.mockResolvedValue(100);

      const result = await service.getUserLedger('user-1', 3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(10);
    });

    it('should query orders where user is buyer or seller', async () => {
      prisma.commissionLedger.findMany.mockResolvedValue([]);
      prisma.commissionLedger.count.mockResolvedValue(0);

      await service.getUserLedger('user-1');

      expect(prisma.commissionLedger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            order: {
              OR: [{ sellerId: 'user-1' }, { buyerId: 'user-1' }],
            },
          },
        }),
      );
    });

    it('should order entries by createdAt descending', async () => {
      prisma.commissionLedger.findMany.mockResolvedValue([]);
      prisma.commissionLedger.count.mockResolvedValue(0);

      await service.getUserLedger('user-1');

      expect(prisma.commissionLedger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });
});
