import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AuctionService } from './auction.service';

interface AuctionEndJobData {
  listingId: string;
  auctionId: string;
}

@Processor('auction-queue')
export class AuctionProcessor extends WorkerHost {
  private readonly logger = new Logger(AuctionProcessor.name);

  constructor(private readonly auctionService: AuctionService) {
    super();
  }

  async process(job: Job<AuctionEndJobData>) {
    const { listingId, auctionId } = job.data;

    this.logger.log(`Processing auction end job for ${listingId} (${auctionId})`);

    try {
      const result = await this.auctionService.endAuction(listingId);

      if (result) {
        this.logger.log(
          `Auction ${auctionId} ended successfully. Winner: ${result.winner.userId}, Order: ${result.order.id}`,
        );
      } else {
        this.logger.log(
          `Auction ${auctionId} ended with no winner or reserve not met.`,
        );
      }

      return { success: true, listingId, auctionId };
    } catch (error) {
      this.logger.error(
        `Failed to end auction ${auctionId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
