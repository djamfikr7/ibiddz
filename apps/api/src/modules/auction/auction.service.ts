import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { PlaceBidDto } from './dto/place-bid.dto';
import { StartAuctionDto } from './dto/start-auction.dto';
import { AuctionStateDto } from './dto/auction-state.dto';
import { AuctionGateway } from './auction.gateway';

export enum AuctionStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  EXTENDED = 'EXTENDED',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

interface AuctionRedisState {
  auctionId: string;
  listingId: string;
  sellerId: string;
  status: AuctionStatus;
  currentPrice: number;
  startPrice: number;
  reservePrice: number | null;
  highestBidderId: string | null;
  highestBidderPhone: string | null;
  bidCount: number;
  startsAt: number;
  endsAt: number;
  extended: boolean;
  lastBidAt: number;
  proxyBids: Record<string, number>;
}

const MIN_INCREMENT_DZD = 500;
const MIN_INCREMENT_PCT = 0.02;
const MAX_INCREMENT_MULTIPLIER = 10;
const ANTI_SNIPING_THRESHOLD_MS = 15_000;
const ANTI_SNIPING_EXTENSION_MS = 30_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_BIDS = 10;

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(forwardRef(() => AuctionGateway))
    private readonly gateway: AuctionGateway,
  ) {}

  private auctionKey(listingId: string): string {
    return `auction:${listingId}`;
  }

  private bidRateKey(userId: string): string {
    return `bid:rate:${userId}`;
  }

  async startAuction(
    listingId: string,
    dto: StartAuctionDto,
    sellerId: string,
  ): Promise<AuctionStateDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== sellerId) {
      throw new BadRequestException('You can only start auctions for your own listings');
    }

    if (listing.status !== 'ACTIVE') {
      throw new BadRequestException('Listing must be active to start an auction');
    }

    if (dto.reservePrice !== undefined && dto.reservePrice < dto.startPrice) {
      throw new BadRequestException('Reserve price must be greater than or equal to start price');
    }

    if (dto.durationMinutes > 120) {
      throw new BadRequestException('Auction duration cannot exceed 120 minutes');
    }

    const now = Date.now();
    const startsAt = now;
    const endsAt = now + dto.durationMinutes * 60 * 1000;

    const state: AuctionRedisState = {
      auctionId: `auction_${listingId}_${Date.now()}`,
      listingId,
      sellerId: listing.sellerId,
      status: AuctionStatus.LIVE,
      currentPrice: dto.startPrice,
      startPrice: dto.startPrice,
      reservePrice: dto.reservePrice ?? null,
      highestBidderId: null,
      highestBidderPhone: null,
      bidCount: 0,
      startsAt,
      endsAt,
      extended: false,
      lastBidAt: 0,
      proxyBids: {},
    };

    await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'ACTIVE',
          auctionStart: new Date(startsAt),
          auctionEnd: new Date(endsAt),
          durationMinutes: dto.durationMinutes,
          startingPrice: dto.startPrice,
          reservePrice: dto.reservePrice,
          currentBid: dto.startPrice,
        },
      }),
    ]);

    await this.redis.set(
      this.auctionKey(listingId),
      JSON.stringify(state),
      'EX',
      Math.ceil((endsAt - now) / 1000) + 3600,
    );

    this.gateway.server
      .to(`auction:${listingId}`)
      .emit('auction:state', this.toStateDto(state));

    this.logger.log(`Auction started for listing ${listingId} by seller ${sellerId}`);
    return this.toStateDto(state);
  }

  async placeBid(
    listingId: string,
    userId: string,
    userPhone: string,
    dto: PlaceBidDto,
  ): Promise<{ bid: any; newState: AuctionStateDto }> {
    const state = await this.getAuctionState(listingId);
    if (!state) {
      throw new NotFoundException('Auction not found');
    }

    if (state.status !== AuctionStatus.LIVE && state.status !== AuctionStatus.EXTENDED) {
      throw new BadRequestException('Auction is not active');
    }

    if (state.sellerId === userId) {
      throw new BadRequestException('Sellers cannot bid on their own auctions');
    }

    const now = Date.now();
    if (now >= state.endsAt) {
      throw new BadRequestException('Auction has ended');
    }

    if (state.highestBidderId === userId) {
      throw new ConflictException('You are already the highest bidder');
    }

    await this.checkRateLimit(userId);

    const minIncrement = this.calculateMinIncrement(state.currentPrice);
    const requiredAmount = state.currentPrice + minIncrement;

    if (dto.amount < requiredAmount) {
      throw new BadRequestException(
        `Bid must be at least ${requiredAmount} DZD (current: ${state.currentPrice} + minimum increment: ${minIncrement} DZD)`,
      );
    }

    const maxAllowed = state.currentPrice * MAX_INCREMENT_MULTIPLIER;
    if (dto.amount > maxAllowed) {
      throw new BadRequestException(
        `Bid cannot exceed ${maxAllowed} DZD (${MAX_INCREMENT_MULTIPLIER}x current price)`,
      );
    }

    if (dto.proxyMax !== undefined && dto.proxyMax < dto.amount) {
      throw new BadRequestException('Proxy max must be greater than or equal to bid amount');
    }

    let finalBidAmount = dto.amount;
    let bidType: 'MANUAL' | 'PROXY' | 'AUTO' = 'MANUAL';
    let isAutoBid = false;
    let triggeredByProxy = false;
    let proxyWinnerId: string | null = null;

    if (dto.proxyMax !== undefined) {
      state.proxyBids[userId] = dto.proxyMax;
    }

    const proxyResult = await this.resolveProxyBidding(state, userId, dto.amount);
    if (proxyResult) {
      finalBidAmount = proxyResult.amount;
      bidType = proxyResult.bidType;
      isAutoBid = proxyResult.isAutoBid;
      triggeredByProxy = proxyResult.triggeredByProxy;
      proxyWinnerId = proxyResult.winnerId;
    }

    const actualWinnerId = proxyWinnerId || userId;

    if (state.highestBidderId && state.highestBidderId !== actualWinnerId) {
      const previousBidder = state.highestBidderId;
      this.gateway.emitBidOutbid(listingId, {
        auctionId: state.auctionId,
        listingId,
        previousBidderId: previousBidder,
        newPrice: finalBidAmount,
        timestamp: new Date(),
      });
    }

    state.highestBidderId = actualWinnerId;
    state.highestBidderPhone = userPhone;
    state.currentPrice = finalBidAmount;
    state.bidCount += 1;
    state.lastBidAt = now;

    const timeRemaining = state.endsAt - now;
    let wasExtended = false;
    if (timeRemaining <= ANTI_SNIPING_THRESHOLD_MS && timeRemaining > 0) {
      state.endsAt += ANTI_SNIPING_EXTENSION_MS;
      state.extended = true;
      state.status = AuctionStatus.EXTENDED;
      wasExtended = true;
      this.logger.log(
        `Anti-sniping triggered for auction ${state.auctionId}, extended by ${ANTI_SNIPING_EXTENSION_MS / 1000}s`,
      );
      this.gateway.emitAuctionCountdown(listingId, {
        auctionId: state.auctionId,
        listingId,
        newEndsAt: new Date(state.endsAt),
        timeRemaining: ANTI_SNIPING_EXTENSION_MS,
        extended: true,
      });
    }

    await this.redis.set(
      this.auctionKey(listingId),
      JSON.stringify(state),
      'EX',
      Math.ceil((state.endsAt - now) / 1000) + 3600,
    );

    const bid = await this.prisma.bid.create({
      data: {
        listingId,
        userId,
        amount: finalBidAmount,
        bidType: bidType,
        proxyMaxAmount: dto.proxyMax ?? null,
        isAutoBid,
        triggeredByProxy,
        wasWinning: true,
        ipAddress: '',
      },
    });

    if (state.highestBidderId !== userId) {
      await this.prisma.bid.updateMany({
        where: { listingId, userId: state.highestBidderId, wasWinning: true },
        data: { wasWinning: false, outbidAt: new Date() },
      });
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        currentBid: finalBidAmount,
        bidCount: { increment: 1 },
      },
    });

    this.gateway.emitBidNew(listingId, {
      auctionId: state.auctionId,
      listingId,
      bidderId: userId,
      amount: finalBidAmount,
      bidType,
      isAutoBid,
      timestamp: new Date(),
      bidCount: state.bidCount,
    });

    const newStateDto = this.toStateDto(state);
    this.gateway.emitAuctionState(listingId, newStateDto);

    this.logger.log(
      `Bid placed on auction ${state.auctionId}: ${finalBidAmount} DZD by ${userId} (${bidType})`,
    );

    return { bid, newState: newStateDto };
  }

  private async resolveProxyBidding(
    state: AuctionRedisState,
    currentBidderId: string,
    bidAmount: number,
  ): Promise<{
    amount: number;
    bidType: 'MANUAL' | 'PROXY' | 'AUTO';
    isAutoBid: boolean;
    triggeredByProxy: boolean;
    winnerId: string | null;
  } | null> {
    if (!state.highestBidderId) {
      return null;
    }

    const currentWinnerMax = state.proxyBids[state.highestBidderId];
    if (!currentWinnerMax || currentWinnerMax <= bidAmount) {
      return null;
    }

    const minIncrement = this.calculateMinIncrement(state.currentPrice);
    const proxyBidAmount = Math.min(currentWinnerMax, bidAmount + minIncrement);

    if (proxyBidAmount > bidAmount) {
      return {
        amount: proxyBidAmount,
        bidType: 'PROXY',
        isAutoBid: true,
        triggeredByProxy: true,
        winnerId: state.highestBidderId,
      };
    }

    return null;
  }

  async setProxyBid(
    listingId: string,
    userId: string,
    maxAmount: number,
  ): Promise<AuctionStateDto> {
    const state = await this.getAuctionState(listingId);
    if (!state) {
      throw new NotFoundException('Auction not found');
    }

    if (state.status !== AuctionStatus.LIVE && state.status !== AuctionStatus.EXTENDED) {
      throw new BadRequestException('Auction is not active');
    }

    if (state.sellerId === userId) {
      throw new BadRequestException('Sellers cannot set proxy bids on their own auctions');
    }

    const minIncrement = this.calculateMinIncrement(state.currentPrice);
    if (maxAmount <= state.currentPrice + minIncrement) {
      throw new BadRequestException(
        `Proxy max must be higher than current price plus minimum increment (${state.currentPrice + minIncrement} DZD)`,
      );
    }

    state.proxyBids[userId] = maxAmount;

    await this.redis.set(
      this.auctionKey(listingId),
      JSON.stringify(state),
      'EX',
      Math.ceil((state.endsAt - Date.now()) / 1000) + 3600,
    );

    this.logger.log(
      `Proxy bid set for user ${userId} on auction ${listingId}: ${maxAmount} DZD`,
    );
    return this.toStateDto(state);
  }

  async endAuction(listingId: string): Promise<{ winner: any; order: any } | null> {
    const state = await this.getAuctionState(listingId);
    if (!state) {
      return null;
    }

    if (state.status === AuctionStatus.ENDED || state.status === AuctionStatus.CANCELLED) {
      return null;
    }

    state.status = AuctionStatus.ENDED;

    await this.redis.set(
      this.auctionKey(listingId),
      JSON.stringify(state),
      'EX',
      86400 * 7,
    );

    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'SOLD',
        auctionEnd: new Date(),
      },
    });

    this.gateway.emitAuctionEnded(listingId, {
      auctionId: state.auctionId,
      listingId,
      finalPrice: state.currentPrice,
      bidCount: state.bidCount,
      timestamp: new Date(),
    });

    if (state.highestBidderId) {
      const reserveMet =
        !state.reservePrice || state.currentPrice >= state.reservePrice;

      if (reserveMet) {
        const order = await this.prisma.order.create({
          data: {
            listingId,
            buyerId: state.highestBidderId,
            sellerId: state.sellerId,
            finalPrice: state.currentPrice,
            commissionAmount: 0,
            shippingCost: 0,
            totalAmount: state.currentPrice,
            status: 'PENDING',
            shippingAddress: {},
          },
        });

        this.gateway.emitAuctionWon(listingId, {
          auctionId: state.auctionId,
          listingId,
          winnerId: state.highestBidderId,
          finalPrice: state.currentPrice,
          orderId: order.id,
          timestamp: new Date(),
        });

        this.logger.log(
          `Auction ${state.auctionId} ended. Winner: ${state.highestBidderId}, Order: ${order.id}`,
        );

        return {
          winner: {
            userId: state.highestBidderId,
            phone: state.highestBidderPhone,
          },
          order,
        };
      } else {
        this.logger.warn(
          `Auction ${state.auctionId} ended but reserve not met. Current: ${state.currentPrice}, Reserve: ${state.reservePrice}`,
        );
      }
    } else {
      this.logger.log(`Auction ${state.auctionId} ended with no bids`);
    }

    return null;
  }

  async getAuctionState(listingId: string): Promise<AuctionRedisState | null> {
    const raw = await this.redis.get(this.auctionKey(listingId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  }

  async getStateDto(listingId: string): Promise<AuctionStateDto> {
    const state = await this.getAuctionState(listingId);
    if (!state) {
      throw new NotFoundException('Auction not found');
    }
    return this.toStateDto(state);
  }

  async getLiveAuctions(): Promise<AuctionStateDto[]> {
    const keys = await this.redis.keys('auction:*');
    const states: AuctionStateDto[] = [];

    for (const key of keys) {
      const raw = await this.redis.get(key);
      if (raw) {
        const state: AuctionRedisState = JSON.parse(raw);
        if (
          state.status === AuctionStatus.LIVE ||
          state.status === AuctionStatus.EXTENDED
        ) {
          states.push(this.toStateDto(state));
        }
      }
    }

    return states.sort((a, b) => a.timeRemaining - b.timeRemaining);
  }

  async cancelAuction(listingId: string, reason?: string): Promise<void> {
    const state = await this.getAuctionState(listingId);
    if (!state) {
      throw new NotFoundException('Auction not found');
    }

    state.status = AuctionStatus.CANCELLED;

    await this.redis.set(
      this.auctionKey(listingId),
      JSON.stringify(state),
      'EX',
      86400 * 7,
    );

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'PAUSED' },
    });

    this.gateway.emitAuctionEnded(listingId, {
      auctionId: state.auctionId,
      listingId,
      cancelled: true,
      reason: reason ?? 'Auction cancelled by seller',
      timestamp: new Date(),
    });

    this.logger.log(`Auction ${state.auctionId} cancelled. Reason: ${reason}`);
  }

  private calculateMinIncrement(currentPrice: number): number {
    const percentageIncrement = currentPrice * MIN_INCREMENT_PCT;
    return Math.max(MIN_INCREMENT_DZD, Math.ceil(percentageIncrement / 100) * 100);
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const key = this.bidRateKey(userId);
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    await this.redis.zremrangebyscore(key, '-inf', windowStart);

    const bids = await this.redis.zrangebyscore(key, windowStart, '+inf');
    if (bids.length >= RATE_LIMIT_MAX_BIDS) {
      throw new BadRequestException(
        `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_BIDS} bids per minute.`,
      );
    }

    await this.redis.zadd(key, now, `${now}-${Math.random().toString(36).slice(2)}`);
    await this.redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) + 10);
  }

  private toStateDto(state: AuctionRedisState): AuctionStateDto {
    const now = Date.now();
    const timeRemaining = Math.max(0, state.endsAt - now);

    return {
      auctionId: state.auctionId,
      listingId: state.listingId,
      status: state.status,
      currentPrice: state.currentPrice,
      startPrice: state.startPrice,
      reservePrice: state.reservePrice,
      timeRemaining,
      bidCount: state.bidCount,
      highestBidderId: state.highestBidderId,
      endsAt: new Date(state.endsAt),
      extended: state.extended,
    };
  }
}
