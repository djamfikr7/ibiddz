import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface CommissionEstimate {
  price: number;
  tier: string;
  isAuction: boolean;
  baseFee: number;
  tierDiscount: number;
  auctionSurcharge: number;
  finalCommission: number;
  netToSeller: number;
  capped: boolean;
}

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  private readonly BASE_RATE = 0.03;
  private readonly MIN_FEE = 2000;
  private readonly MAX_FEE = 8500;
  private readonly AUCTION_SURCHARGE = 500;

  private readonly TIER_DISCOUNTS: Record<string, number> = {
    BASICO: 0,
    PRO: 0.015,
    CERTIFIE: 0.020,
    ELITE: 0.025,
  };

  constructor(private readonly prisma: PrismaService) {}

  estimateCommission(params: {
    price: number;
    tier: string;
    auction: boolean;
  }): CommissionEstimate {
    const { price, tier, auction } = params;

    if (price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    if (!this.TIER_DISCOUNTS.hasOwnProperty(tier)) {
      throw new BadRequestException(`Invalid tier: ${tier}`);
    }

    const baseFee = Math.max(this.BASE_RATE * price, this.MIN_FEE);
    const tierDiscount = this.TIER_DISCOUNTS[tier];
    const discountedFee = baseFee * (1 - tierDiscount);
    const auctionSurcharge = auction ? this.AUCTION_SURCHARGE : 0;
    const finalCommission = Math.min(discountedFee + auctionSurcharge, this.MAX_FEE);
    const netToSeller = price - finalCommission;

    return {
      price,
      tier,
      isAuction: auction,
      baseFee: Math.round(baseFee * 100) / 100,
      tierDiscount: Math.round(tierDiscount * 10000) / 100,
      auctionSurcharge,
      finalCommission: Math.round(finalCommission * 100) / 100,
      netToSeller: Math.round(netToSeller * 100) / 100,
      capped: finalCommission >= this.MAX_FEE,
    };
  }

  async calculateCommission(orderId: string): Promise<{
    commissionAmount: Decimal;
    platformFee: Decimal;
    paymentFee: Decimal;
    netToSeller: Decimal;
    breakdown: Record<string, any>;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: true,
        seller: true,
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const price = order.finalPrice.toNumber();
    const tier = order.seller.role;
    const isAuction = order.listing.auctionType !== 'BUY_NOW';

    const estimate = this.estimateCommission({ price, tier, auction: isAuction });

    const commissionAmount = new Decimal(estimate.finalCommission);
    const platformFee = new Decimal(estimate.baseFee);
    const paymentFee = new Decimal(0);
    const netToSeller = new Decimal(estimate.netToSeller);

    const breakdown = {
      salePrice: price,
      baseRate: this.BASE_RATE,
      baseFee: estimate.baseFee,
      tier,
      tierDiscount: estimate.tierDiscount,
      auctionSurcharge: estimate.auctionSurcharge,
      cap: this.MAX_FEE,
      finalCommission: estimate.finalCommission,
      netToSeller: estimate.netToSeller,
    };

    return {
      commissionAmount,
      platformFee,
      paymentFee,
      netToSeller,
      breakdown,
    };
  }

  async createLedgerEntry(orderId: string): Promise<any> {
    const existing = await this.prisma.commissionLedger.findFirst({
      where: { orderId },
    });

    if (existing) {
      return existing;
    }

    const { commissionAmount, platformFee, paymentFee, netToSeller, breakdown } =
      await this.calculateCommission(orderId);

    const ledger = await this.prisma.commissionLedger.create({
      data: {
        orderId,
        commissionAmount,
        platformFee,
        paymentFee,
        netToSeller,
        breakdown: breakdown as any,
        settled: false,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { commissionAmount },
    });

    return ledger;
  }

  async settleCommission(ledgerId: string): Promise<any> {
    const ledger = await this.prisma.commissionLedger.findUnique({
      where: { id: ledgerId },
      include: { order: true },
    });

    if (!ledger) {
      throw new BadRequestException('Ledger entry not found');
    }

    if (ledger.settled) {
      return ledger;
    }

    const updated = await this.prisma.commissionLedger.update({
      where: { id: ledgerId },
      data: {
        settled: true,
        settledAt: new Date(),
        settlementRef: `SETTLE-${Date.now()}-${ledgerId.slice(-6)}`,
      },
    });

    return updated;
  }

  async getUserLedger(userId: string, page = 1, limit = 20): Promise<{
    entries: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where: {
          order: {
            OR: [{ sellerId: userId }, { buyerId: userId }],
          },
        },
        include: {
          order: {
            select: {
              id: true,
              finalPrice: true,
              status: true,
              createdAt: true,
              listing: {
                select: { title: true, model: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.commissionLedger.count({
        where: {
          order: {
            OR: [{ sellerId: userId }, { buyerId: userId }],
          },
        },
      }),
    ]);

    return {
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
