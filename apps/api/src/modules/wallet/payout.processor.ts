import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/services/prisma.service';

@Processor('payouts')
export class PayoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PayoutProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ payoutId: string }>) {
    const { payoutId } = job.data;

    this.logger.log(`Processing payout: ${payoutId}`);

    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { user: true },
    });

    if (!payout) {
      throw new Error(`Payout request not found: ${payoutId}`);
    }

    if (payout.status !== 'PENDING') {
      this.logger.warn(`Payout already processed: ${payoutId} (${payout.status})`);
      return { status: 'skipped', reason: 'already_processed' };
    }

    try {
      await this.prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: 'PROCESSING',
          processedAt: new Date(),
        },
      });

      await this.executePayout(payout);

      const updated = await this.prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: 'COMPLETED',
          transactionId: `TXN-${Date.now()}-${payoutId.slice(-6)}`,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          entityType: 'PayoutRequest',
          entityId: payoutId,
          action: 'PAYOUT_APPROVE',
          reason: 'Automated payout processed',
          metadata: {
            type: 'PAYOUT_COMPLETED',
            amount: payout.amount.toNumber(),
            method: payout.method,
            transactionId: updated.transactionId,
          },
        },
      });

      this.logger.log(`Payout completed: ${payoutId}`);
      return { status: 'completed', payoutId };
    } catch (error) {
      this.logger.error(`Payout failed: ${payoutId}`, error);

      await this.prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: 'REJECTED',
          rejectionReason: error instanceof Error ? error.message : 'Processing failed',
        },
      });

      await this.prisma.user.update({
        where: { id: payout.userId },
        data: {
          walletDZD: {
            increment: payout.amount,
          },
        },
      });

      throw error;
    }
  }

  private async executePayout(payout: any): Promise<void> {
    const { method, payoutDetails, amount } = payout;

    switch (method) {
      case 'CCP':
        await this.processCCPPayout(payoutDetails, amount);
        break;
      case 'EDAHABIA':
        await this.processEDAHABIAPayout(payoutDetails, amount);
        break;
      case 'BANK':
        await this.processBankPayout(payoutDetails, amount);
        break;
      default:
        throw new Error(`Unsupported payout method: ${method}`);
    }
  }

  private async processCCPPayout(details: any, amount: any): Promise<void> {
    this.logger.log(
      `Processing CCP payout: ${details.ccpAccount} - ${amount.toNumber()} DZD`,
    );
  }

  private async processEDAHABIAPayout(details: any, amount: any): Promise<void> {
    this.logger.log(
      `Processing EDAHABIA payout: ${details.cardNumber} - ${amount.toNumber()} DZD`,
    );
  }

  private async processBankPayout(details: any, amount: any): Promise<void> {
    this.logger.log(
      `Processing Bank payout: ${details.iban} - ${amount.toNumber()} DZD`,
    );
  }
}
