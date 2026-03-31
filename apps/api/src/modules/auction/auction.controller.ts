import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { AuctionService } from './auction.service';
import { StartAuctionDto } from './dto/start-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';

@Controller('v1')
export class AuctionController {
  private readonly logger = new Logger(AuctionController.name);

  constructor(private readonly auctionService: AuctionService) {}

  @Post('auctions/:listingId/start')
  @UseGuards(JwtGuard)
  async startAuction(
    @Param('listingId') listingId: string,
    @Body() dto: StartAuctionDto,
    @Req() req: any,
  ) {
    this.logger.log(`Starting auction for listing ${listingId}`);
    return this.auctionService.startAuction(listingId, dto, req.user.userId);
  }

  @Get('auctions/:listingId/state')
  @UseGuards(OptionalAuthGuard)
  async getAuctionState(@Param('listingId') listingId: string) {
    return this.auctionService.getStateDto(listingId);
  }

  @Post('auctions/:listingId/proxy-bid')
  @UseGuards(JwtGuard)
  async setProxyBid(
    @Param('listingId') listingId: string,
    @Body() body: { maxAmount: number },
    @Req() req: any,
  ) {
    this.logger.log(`Setting proxy bid for listing ${listingId}`);
    return this.auctionService.setProxyBid(
      listingId,
      req.user.userId,
      body.maxAmount,
    );
  }

  @Post('auctions/:listingId/bid')
  @UseGuards(JwtGuard)
  async placeBid(
    @Param('listingId') listingId: string,
    @Body() dto: PlaceBidDto,
    @Req() req: any,
  ) {
    this.logger.log(`Placing bid on listing ${listingId}`);
    return this.auctionService.placeBid(
      listingId,
      req.user.userId,
      req.user.phone,
      dto,
    );
  }

  /**
   * Blueprint endpoint: POST /v1/bids
   * Alias for placing a bid on the current winning auction
   */
  @Post('bids')
  @UseGuards(JwtGuard)
  async placeBidDirect(
    @Body() dto: PlaceBidDto & { listingId: string },
    @Req() req: any,
  ) {
    this.logger.log(`Placing direct bid on listing ${dto.listingId}`);
    return this.auctionService.placeBid(
      dto.listingId,
      req.user.userId,
      req.user.phone,
      { amount: dto.amount, proxyMax: dto.proxyMax },
    );
  }

  @Get('auctions/live')
  @UseGuards(OptionalAuthGuard)
  async getLiveAuctions() {
    return this.auctionService.getLiveAuctions();
  }

  @Post('auctions/:listingId/cancel')
  @UseGuards(JwtGuard)
  async cancelAuction(
    @Param('listingId') listingId: string,
    @Body() body?: { reason?: string },
  ) {
    this.logger.log(`Cancelling auction for listing ${listingId}`);
    await this.auctionService.cancelAuction(listingId, body?.reason);
    return { success: true };
  }
}
