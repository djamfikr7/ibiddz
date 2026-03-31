import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';

export interface WalletBalance {
  available: number;
  locked: number;
  total: number;
}

export interface TransactionRecord {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  reference?: string;
  createdAt: Date;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly RESERVE_PERCENT = 0.1;
  private readonly WITHDRAWAL_FEE_THRESHOLD = 50000;
  private readonly WITHDRAWAL_FEE_RATE = 0.01;
  private readonly PROCESSING_HOURS = 24;

  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<WalletBalance> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletDZD: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const lockedTransactions = await this.prisma.payoutRequest.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING', 'APPROVED'] },
      },
      select: { amount: true },
    });

    const locked = lockedTransactions.reduce(
      (sum, t) => sum + t.amount.toNumber(),
      0,
    );

    const total = user.walletDZD.toNumber();
    const available = Math.max(0, total - locked);

    return { available, locked, total };
  }

  async creditOnSettlement(
    userId: string,
    salePrice: number,
    commission: number,
  ): Promise<{ credited: number; reserve: number; transactionId: string }> {
    const reserve = salePrice * this.RESERVE_PERCENT;
    const netAmount = salePrice - commission - reserve;

    if (netAmount < 0) {
      throw new BadRequestException('Settlement would result in negative credit');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletDZD: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const transactionId = randomUUID();

      await tx.user.update({
        where: { id: userId },
        data: { walletDZD: { increment: new Decimal(netAmount) } },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'Wallet',
          entityId: userId,
          action: 'UPDATE',
          reason: 'Settlement credit',
          metadata: {
            type: 'SETTLEMENT_CREDIT',
            salePrice,
            commission,
            reserve,
            netAmount,
            transactionId,
          },
        },
      });

      return {
        credited: netAmount,
        reserve,
        transactionId,
        newBalance: user.walletDZD.toNumber() + netAmount,
      };
    });

    return {
      credited: result.credited,
      reserve: result.reserve,
      transactionId: result.transactionId,
    };
  }

  async debitForFees(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletDZD: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const currentBalance = user.walletDZD.toNumber();
      if (currentBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.user.update({
        where: { id: userId },
        data: { walletDZD: { decrement: new Decimal(amount) } },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'Wallet',
          entityId: userId,
          action: 'UPDATE',
          reason: `Debit: ${reason}`,
          metadata: {
            type: 'FEE_DEBIT',
            amount,
            reason,
          },
        },
      });

      return {
        success: true,
        newBalance: currentBalance - amount,
      };
    });

    return result;
  }

  async requestWithdrawal(
    userId: string,
    amount: number,
    method: string,
    payoutDetails: Record<string, any>,
  ): Promise<{
    requestId: string;
    amount: number;
    fee: number;
    netAmount: number;
    status: string;
    estimatedProcessing: Date;
  }> {
    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be positive');
    }

    const balance = await this.getBalance(userId);
    if (amount > balance.available) {
      throw new BadRequestException('Insufficient available balance');
    }

    const fee =
      balance.total < this.WITHDRAWAL_FEE_THRESHOLD
        ? amount * this.WITHDRAWAL_FEE_RATE
        : 0;
    const netAmount = amount - fee;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { walletDZD: { decrement: new Decimal(amount) } },
      });

      const payout = await tx.payoutRequest.create({
        data: {
          userId,
          amount: new Decimal(netAmount),
          method: method as any,
          payoutDetails: payoutDetails as any,
          status: 'PENDING',
          reference: `WD-${Date.now()}-${userId.slice(-6)}`,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'Wallet',
          entityId: userId,
          action: 'UPDATE',
          reason: `Withdrawal request: ${amount} DZD via ${method}`,
          metadata: {
            type: 'WITHDRAWAL_REQUEST',
            amount,
            fee,
            netAmount,
            method,
            payoutId: payout.id,
          },
        },
      });

      return {
        requestId: payout.id,
        amount,
        fee,
        netAmount,
        status: payout.status,
        estimatedProcessing: new Date(
          Date.now() + this.PROCESSING_HOURS * 60 * 60 * 1000,
        ),
      };
    });

    return result;
  }

  async purchaseCredits(
    userId: string,
    creditCount: number,
    pricePerCredit: number,
  ): Promise<{
    success: boolean;
    creditsPurchased: number;
    totalCost: number;
    newBalance: number;
  }> {
    const totalCost = creditCount * pricePerCredit;

    if (totalCost <= 0) {
      throw new BadRequestException('Invalid credit purchase amount');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletDZD: true, broadcastCredits: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const currentBalance = user.walletDZD.toNumber();
      if (currentBalance < totalCost) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          walletDZD: { decrement: new Decimal(totalCost) },
          broadcastCredits: { increment: creditCount },
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'Wallet',
          entityId: userId,
          action: 'UPDATE',
          reason: `Broadcast credits purchase: ${creditCount} credits`,
          metadata: {
            type: 'CREDIT_PURCHASE',
            creditCount,
            pricePerCredit,
            totalCost,
          },
        },
      });

      return {
        success: true,
        creditsPurchased: creditCount,
        totalCost,
        newBalance: currentBalance - totalCost,
      };
    });

    return result;
  }

  async lockBalanceForDispute(userId: string, amount: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletDZD: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const metadata = (user as any).metadata || {};
      const lockedAmount = (metadata.lockedBalance || 0) + amount;

      await tx.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...metadata,
            lockedBalance: lockedAmount,
            disputeLocks: [
              ...(metadata.disputeLocks || []),
              {
                amount,
                lockedAt: new Date().toISOString(),
                reason: 'Dispute hold',
              },
            ],
          },
        },
      });
    });
  }

  async unlockBalance(userId: string, amount: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const metadata = ((user as any).metadata as Record<string, any>) || {};
      const currentLocked = metadata.lockedBalance || 0;
      const newLocked = Math.max(0, currentLocked - amount);

      await tx.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...metadata,
            lockedBalance: newLocked,
          },
        },
      });
    });
  }

  async getTransactions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    transactions: TransactionRecord[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'Wallet',
        entityId: userId,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await this.prisma.auditLog.count({
      where: {
        entityType: 'Wallet',
        entityId: userId,
      },
    });

    const transactions: TransactionRecord[] = auditLogs.map((log) => {
      const meta = (log.metadata as Record<string, any>) || {};
      return {
        id: log.id,
        type: meta.type || 'UNKNOWN',
        amount: meta.amount || meta.netAmount || 0,
        balance: 0,
        description: log.reason || 'Transaction',
        reference: meta.transactionId || meta.payoutId,
        createdAt: log.createdAt,
      };
    });

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
