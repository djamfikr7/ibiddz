import { Test, TestingModule } from '@nestjs/testing';
import { AuctionService, AuctionStatus } from './auction.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { AuctionGateway } from './auction.gateway';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PlaceBidDto } from './dto/place-bid.dto';
import { StartAuctionDto } from './dto/start-auction.dto';

const mockPrismaService = {
  listing: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  bid: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  order: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  zremrangebyscore: jest.fn(),
  zrangebyscore: jest.fn(),
  zadd: jest.fn(),
  expire: jest.fn(),
};

const mockGateway = {
  server: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
  emitBidOutbid: jest.fn(),
  emitBidNew: jest.fn(),
  emitAuctionState: jest.fn(),
  emitAuctionEnded: jest.fn(),
  emitAuctionWon: jest.fn(),
  emitAuctionCountdown: jest.fn(),
};

function createAuctionState(overrides: Partial<any> = {}): any {
  const now = Date.now();
  return {
    auctionId: 'auction_test_123',
    listingId: 'listing-1',
    sellerId: 'seller-1',
    status: AuctionStatus.LIVE,
    currentPrice: 10000,
    startPrice: 10000,
    reservePrice: null,
    highestBidderId: null,
    highestBidderPhone: null,
    bidCount: 0,
    startsAt: now,
    endsAt: now + 10 * 60 * 1000,
    extended: false,
    lastBidAt: 0,
    proxyBids: {},
    ...overrides,
  };
}

describe('AuctionService', () => {
  let service: AuctionService;
  let prisma: typeof mockPrismaService;
  let redis: typeof mockRedisService;
  let gateway: typeof mockGateway;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: AuctionGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<AuctionService>(AuctionService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    gateway = module.get(AuctionGateway);
  });

  describe('startAuction', () => {
    it('should start auction with valid parameters', async () => {
      const mockListing = {
        id: 'listing-1',
        sellerId: 'seller-1',
        status: 'ACTIVE',
        seller: { id: 'seller-1' },
      };
      prisma.listing.findUnique.mockResolvedValue(mockListing);
      prisma.$transaction.mockResolvedValue([{}]);
      redis.set.mockResolvedValue('OK');

      const dto: StartAuctionDto = {
        startPrice: 10000,
        durationMinutes: 10,
      };

      const result = await service.startAuction('listing-1', dto, 'seller-1');

      expect(result.status).toBe('LIVE');
      expect(result.currentPrice).toBe(10000);
      expect(result.startPrice).toBe(10000);
      expect(result.bidCount).toBe(0);
      expect(result.highestBidderId).toBeNull();
      expect(redis.set).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error when listing not found', async () => {
      prisma.listing.findUnique.mockResolvedValue(null);

      const dto: StartAuctionDto = {
        startPrice: 10000,
        durationMinutes: 10,
      };

      await expect(
        service.startAuction('nonexistent', dto, 'seller-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when seller does not own listing', async () => {
      const mockListing = {
        id: 'listing-1',
        sellerId: 'other-seller',
        status: 'ACTIVE',
        seller: { id: 'other-seller' },
      };
      prisma.listing.findUnique.mockResolvedValue(mockListing);

      const dto: StartAuctionDto = {
        startPrice: 10000,
        durationMinutes: 10,
      };

      await expect(
        service.startAuction('listing-1', dto, 'seller-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when listing is not active', async () => {
      const mockListing = {
        id: 'listing-1',
        sellerId: 'seller-1',
        status: 'PAUSED',
        seller: { id: 'seller-1' },
      };
      prisma.listing.findUnique.mockResolvedValue(mockListing);

      const dto: StartAuctionDto = {
        startPrice: 10000,
        durationMinutes: 10,
      };

      await expect(
        service.startAuction('listing-1', dto, 'seller-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when reserve price is less than start price', async () => {
      const mockListing = {
        id: 'listing-1',
        sellerId: 'seller-1',
        status: 'ACTIVE',
        seller: { id: 'seller-1' },
      };
      prisma.listing.findUnique.mockResolvedValue(mockListing);

      const dto: StartAuctionDto = {
        startPrice: 10000,
        reservePrice: 5000,
        durationMinutes: 10,
      };

      await expect(
        service.startAuction('listing-1', dto, 'seller-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when duration exceeds 120 minutes', async () => {
      const mockListing = {
        id: 'listing-1',
        sellerId: 'seller-1',
        status: 'ACTIVE',
        seller: { id: 'seller-1' },
      };
      prisma.listing.findUnique.mockResolvedValue(mockListing);

      const dto: StartAuctionDto = {
        startPrice: 10000,
        durationMinutes: 150,
      };

      await expect(
        service.startAuction('listing-1', dto, 'seller-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid reserve price equal to start price', async () => {
      const mockListing = {
        id: 'listing-1',
        sellerId: 'seller-1',
        status: 'ACTIVE',
        seller: { id: 'seller-1' },
      };
      prisma.listing.findUnique.mockResolvedValue(mockListing);
      prisma.$transaction.mockResolvedValue([{}]);
      redis.set.mockResolvedValue('OK');

      const dto: StartAuctionDto = {
        startPrice: 10000,
        reservePrice: 10000,
        durationMinutes: 10,
      };

      const result = await service.startAuction('listing-1', dto, 'seller-1');

      expect(result.reservePrice).toBe(10000);
    });

    it('should emit auction state via gateway', async () => {
      const mockListing = {
        id: 'listing-1',
        sellerId: 'seller-1',
        status: 'ACTIVE',
        seller: { id: 'seller-1' },
      };
      prisma.listing.findUnique.mockResolvedValue(mockListing);
      prisma.$transaction.mockResolvedValue([{}]);
      redis.set.mockResolvedValue('OK');

      const dto: StartAuctionDto = {
        startPrice: 10000,
        durationMinutes: 10,
      };

      await service.startAuction('listing-1', dto, 'seller-1');

      expect(mockGateway.server.to).toHaveBeenCalledWith('auction:listing-1');
      expect(mockGateway.server.emit).toHaveBeenCalledWith(
        'auction:state',
        expect.any(Object),
      );
    });
  });

  describe('placeBid - bid validation', () => {
    it('should throw error when auction not found', async () => {
      redis.get.mockResolvedValue(null);

      const dto: PlaceBidDto = { amount: 15000 };

      await expect(
        service.placeBid('nonexistent', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when auction is not active', async () => {
      const state = createAuctionState({ status: AuctionStatus.ENDED });
      redis.get.mockResolvedValue(JSON.stringify(state));

      const dto: PlaceBidDto = { amount: 15000 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when seller bids on own auction', async () => {
      const state = createAuctionState({ sellerId: 'seller-1' });
      redis.get.mockResolvedValue(JSON.stringify(state));

      const dto: PlaceBidDto = { amount: 15000 };

      await expect(
        service.placeBid('listing-1', 'seller-1', '0555555555', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when auction has ended', async () => {
      const state = createAuctionState({
        endsAt: Date.now() - 1000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));

      const dto: PlaceBidDto = { amount: 15000 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when current highest bidder tries to bid again', async () => {
      const state = createAuctionState({
        highestBidderId: 'buyer-1',
      });
      redis.get.mockResolvedValue(JSON.stringify(state));

      const dto: PlaceBidDto = { amount: 15000 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw error when bid is below minimum increment', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 10100 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when bid exceeds maximum allowed', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);

      const dto: PlaceBidDto = { amount: 200000 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid bid above minimum increment', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1', amount: 11000 });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      const result = await service.placeBid(
        'listing-1',
        'buyer-1',
        '0555555555',
        dto,
      );

      expect(result.newState.currentPrice).toBe(11000);
      expect(result.newState.highestBidderId).toBe('buyer-1');
      expect(result.newState.bidCount).toBe(1);
    });
  });

  describe('placeBid - minimum increment', () => {
    it('should require at least 500 DZD increment for low prices', async () => {
      const state = createAuctionState({ currentPrice: 5000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 5500 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require 2% increment for higher prices', async () => {
      const state = createAuctionState({ currentPrice: 50000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 50500 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept bid meeting exact minimum increment', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      const result = await service.placeBid(
        'listing-1',
        'buyer-1',
        '0555555555',
        dto,
      );

      expect(result.newState.currentPrice).toBe(11000);
    });
  });

  describe('placeBid - anti-sniping', () => {
    it('should extend auction by 30s when bid placed in last 15s', async () => {
      const now = Date.now();
      const state = createAuctionState({
        endsAt: now + 10000,
        currentPrice: 10000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      const result = await service.placeBid(
        'listing-1',
        'buyer-1',
        '0555555555',
        dto,
      );

      expect(result.newState.extended).toBe(true);
      expect(result.newState.status).toBe('EXTENDED');
      expect(result.newState.endsAt.getTime()).toBeGreaterThan(now + 10000);
    });

    it('should not extend auction when bid placed with more than 15s remaining', async () => {
      const now = Date.now();
      const state = createAuctionState({
        endsAt: now + 60000,
        currentPrice: 10000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      const result = await service.placeBid(
        'listing-1',
        'buyer-1',
        '0555555555',
        dto,
      );

      expect(result.newState.extended).toBe(false);
      expect(result.newState.status).toBe('LIVE');
    });

    it('should emit countdown event when anti-sniping triggered', async () => {
      const now = Date.now();
      const state = createAuctionState({
        endsAt: now + 10000,
        currentPrice: 10000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      await service.placeBid('listing-1', 'buyer-1', '0555555555', dto);

      expect(gateway.emitAuctionCountdown).toHaveBeenCalled();
    });
  });

  describe('placeBid - proxy bidding', () => {
    it('should store proxy max when provided', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000, proxyMax: 20000 };

      await service.placeBid('listing-1', 'buyer-1', '0555555555', dto);

      expect(redis.set).toHaveBeenCalledWith(
        'auction:listing-1',
        expect.stringContaining('"proxyBids"'),
        expect.any(String),
        expect.any(Number),
      );
    });

    it('should throw error when proxy max is less than bid amount', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));

      const dto: PlaceBidDto = { amount: 11000, proxyMax: 10500 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should trigger proxy bid when existing bidder has higher proxy max', async () => {
      const state = createAuctionState({
        currentPrice: 10000,
        highestBidderId: 'buyer-1',
        proxyBids: { 'buyer-1': 20000 },
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 12000 };

      const result = await service.placeBid(
        'listing-1',
        'buyer-2',
        '0555555555',
        dto,
      );

      expect(result.newState.highestBidderId).toBe('buyer-1');
      expect(result.newState.currentPrice).toBe(12500);
    });

    it('should allow new bidder to win when their bid exceeds proxy max', async () => {
      const state = createAuctionState({
        currentPrice: 10000,
        highestBidderId: 'buyer-1',
        proxyBids: { 'buyer-1': 15000 },
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 16000 };

      const result = await service.placeBid(
        'listing-1',
        'buyer-2',
        '0555555555',
        dto,
      );

      expect(result.newState.highestBidderId).toBe('buyer-2');
      expect(result.newState.currentPrice).toBe(16000);
    });
  });

  describe('placeBid - rate limiting', () => {
    it('should allow bid when under rate limit', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue(['bid1', 'bid2']);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).resolves.not.toThrow();
    });

    it('should reject bid when rate limit exceeded', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([
        'bid1',
        'bid2',
        'bid3',
        'bid4',
        'bid5',
        'bid6',
        'bid7',
        'bid8',
        'bid9',
        'bid10',
      ]);

      const dto: PlaceBidDto = { amount: 11000 };

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.placeBid('listing-1', 'buyer-1', '0555555555', dto),
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should clean up expired bids before checking rate limit', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      await service.placeBid('listing-1', 'buyer-1', '0555555555', dto);

      expect(redis.zremrangebyscore).toHaveBeenCalledWith(
        'bid:rate:buyer-1',
        '-inf',
        expect.any(Number),
      );
    });
  });

  describe('placeBid - outbid notification', () => {
    it('should emit outbid event when previous bidder is outbid', async () => {
      const state = createAuctionState({
        currentPrice: 10000,
        highestBidderId: 'buyer-1',
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      await service.placeBid('listing-1', 'buyer-2', '0555555555', dto);

      expect(gateway.emitBidOutbid).toHaveBeenCalledWith('listing-1', {
        auctionId: 'auction_test_123',
        listingId: 'listing-1',
        previousBidderId: 'buyer-1',
        newPrice: 11000,
        timestamp: expect.any(Date),
      });
    });

    it('should not emit outbid event for first bid', async () => {
      const state = createAuctionState({
        currentPrice: 10000,
        highestBidderId: null,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      await service.placeBid('listing-1', 'buyer-1', '0555555555', dto);

      expect(gateway.emitBidOutbid).not.toHaveBeenCalled();
    });
  });

  describe('placeBid - bid persistence', () => {
    it('should create bid record in database', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      await service.placeBid('listing-1', 'buyer-1', '0555555555', dto);

      expect(prisma.bid.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          listingId: 'listing-1',
          userId: 'buyer-1',
          amount: 11000,
          wasWinning: true,
        }),
      });
    });

    it('should update listing current bid and bid count', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      await service.placeBid('listing-1', 'buyer-1', '0555555555', dto);

      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: expect.objectContaining({
          currentBid: 11000,
          bidCount: { increment: 1 },
        }),
      });
    });

    it('should emit new bid event via gateway', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.zremrangebyscore.mockResolvedValue(0);
      redis.zrangebyscore.mockResolvedValue([]);
      redis.zadd.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      prisma.bid.create.mockResolvedValue({ id: 'bid-1' });
      prisma.listing.update.mockResolvedValue({});

      const dto: PlaceBidDto = { amount: 11000 };

      await service.placeBid('listing-1', 'buyer-1', '0555555555', dto);

      expect(gateway.emitBidNew).toHaveBeenCalled();
      expect(gateway.emitAuctionState).toHaveBeenCalled();
    });
  });

  describe('setProxyBid', () => {
    it('should set proxy bid for user', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');

      const result = await service.setProxyBid('listing-1', 'buyer-1', 20000);

      expect(result).toBeDefined();
      expect(redis.set).toHaveBeenCalledWith(
        'auction:listing-1',
        expect.stringContaining('"20000"'),
        expect.any(String),
        expect.any(Number),
      );
    });

    it('should throw error when auction not found', async () => {
      redis.get.mockResolvedValue(null);

      await expect(
        service.setProxyBid('nonexistent', 'buyer-1', 20000),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when auction is not active', async () => {
      const state = createAuctionState({ status: AuctionStatus.ENDED });
      redis.get.mockResolvedValue(JSON.stringify(state));

      await expect(
        service.setProxyBid('listing-1', 'buyer-1', 20000),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when seller sets proxy bid', async () => {
      const state = createAuctionState({ sellerId: 'seller-1' });
      redis.get.mockResolvedValue(JSON.stringify(state));

      await expect(
        service.setProxyBid('listing-1', 'seller-1', 20000),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when proxy max is not high enough', async () => {
      const state = createAuctionState({ currentPrice: 10000 });
      redis.get.mockResolvedValue(JSON.stringify(state));

      await expect(
        service.setProxyBid('listing-1', 'buyer-1', 10500),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('endAuction', () => {
    it('should return null when auction state not found', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.endAuction('listing-1');

      expect(result).toBeNull();
    });

    it('should return null when auction already ended', async () => {
      const state = createAuctionState({ status: AuctionStatus.ENDED });
      redis.get.mockResolvedValue(JSON.stringify(state));

      const result = await service.endAuction('listing-1');

      expect(result).toBeNull();
    });

    it('should return null when auction is cancelled', async () => {
      const state = createAuctionState({ status: AuctionStatus.CANCELLED });
      redis.get.mockResolvedValue(JSON.stringify(state));

      const result = await service.endAuction('listing-1');

      expect(result).toBeNull();
    });

    it('should create order when there is a winning bidder and reserve met', async () => {
      const state = createAuctionState({
        status: AuctionStatus.LIVE,
        highestBidderId: 'buyer-1',
        highestBidderPhone: '0555555555',
        currentPrice: 15000,
        reservePrice: 12000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');
      prisma.listing.update.mockResolvedValue({});

      const mockOrder = {
        id: 'order-1',
        listingId: 'listing-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        finalPrice: 15000,
      };
      prisma.order.create.mockResolvedValue(mockOrder);

      const result = await service.endAuction('listing-1');

      expect(result).not.toBeNull();
      expect(result?.winner.userId).toBe('buyer-1');
      expect(result?.order).toEqual(mockOrder);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          listingId: 'listing-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
          finalPrice: 15000,
          status: 'PENDING',
        }),
      });
    });

    it('should not create order when reserve price not met', async () => {
      const state = createAuctionState({
        status: AuctionStatus.LIVE,
        highestBidderId: 'buyer-1',
        currentPrice: 10000,
        reservePrice: 15000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');
      prisma.listing.update.mockResolvedValue({});

      const result = await service.endAuction('listing-1');

      expect(result).toBeNull();
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('should create order when no reserve price set', async () => {
      const state = createAuctionState({
        status: AuctionStatus.LIVE,
        highestBidderId: 'buyer-1',
        currentPrice: 10000,
        reservePrice: null,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');
      prisma.listing.update.mockResolvedValue({});

      const mockOrder = { id: 'order-1' };
      prisma.order.create.mockResolvedValue(mockOrder);

      const result = await service.endAuction('listing-1');

      expect(result).not.toBeNull();
      expect(prisma.order.create).toHaveBeenCalled();
    });

    it('should return null when no bids placed', async () => {
      const state = createAuctionState({
        status: AuctionStatus.LIVE,
        highestBidderId: null,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');
      prisma.listing.update.mockResolvedValue({});

      const result = await service.endAuction('listing-1');

      expect(result).toBeNull();
    });

    it('should update listing status to SOLD', async () => {
      const state = createAuctionState({
        status: AuctionStatus.LIVE,
        highestBidderId: 'buyer-1',
        currentPrice: 15000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');
      prisma.listing.update.mockResolvedValue({});
      prisma.order.create.mockResolvedValue({ id: 'order-1' });

      await service.endAuction('listing-1');

      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: expect.objectContaining({
          status: 'SOLD',
        }),
      });
    });

    it('should emit auction ended event', async () => {
      const state = createAuctionState({
        status: AuctionStatus.LIVE,
        highestBidderId: 'buyer-1',
        currentPrice: 15000,
        bidCount: 5,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');
      prisma.listing.update.mockResolvedValue({});
      prisma.order.create.mockResolvedValue({ id: 'order-1' });

      await service.endAuction('listing-1');

      expect(gateway.emitAuctionEnded).toHaveBeenCalledWith('listing-1', {
        auctionId: 'auction_test_123',
        listingId: 'listing-1',
        finalPrice: 15000,
        bidCount: 5,
        timestamp: expect.any(Date),
      });
    });

    it('should emit won event to winner', async () => {
      const state = createAuctionState({
        status: AuctionStatus.LIVE,
        highestBidderId: 'buyer-1',
        currentPrice: 15000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');
      prisma.listing.update.mockResolvedValue({});
      prisma.order.create.mockResolvedValue({ id: 'order-1' });

      await service.endAuction('listing-1');

      expect(gateway.emitAuctionWon).toHaveBeenCalled();
    });
  });

  describe('cancelAuction', () => {
    it('should cancel active auction', async () => {
      const state = createAuctionState({ status: AuctionStatus.LIVE });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');
      prisma.listing.update.mockResolvedValue({});

      await service.cancelAuction('listing-1', 'Seller request');

      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { status: 'PAUSED' },
      });
      expect(gateway.emitAuctionEnded).toHaveBeenCalledWith(
        'listing-1',
        expect.objectContaining({
          cancelled: true,
          reason: 'Seller request',
        }),
      );
    });

    it('should throw error when auction not found', async () => {
      redis.get.mockResolvedValue(null);

      await expect(service.cancelAuction('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use default reason when none provided', async () => {
      const state = createAuctionState({ status: AuctionStatus.LIVE });
      redis.get.mockResolvedValue(JSON.stringify(state));
      redis.set.mockResolvedValue('OK');
      prisma.listing.update.mockResolvedValue({});

      await service.cancelAuction('listing-1');

      expect(gateway.emitAuctionEnded).toHaveBeenCalledWith(
        'listing-1',
        expect.objectContaining({
          reason: 'Auction cancelled by seller',
        }),
      );
    });
  });

  describe('getAuctionState', () => {
    it('should return parsed auction state from Redis', async () => {
      const state = createAuctionState();
      redis.get.mockResolvedValue(JSON.stringify(state));

      const result = await service.getAuctionState('listing-1');

      expect(result).toEqual(state);
      expect(redis.get).toHaveBeenCalledWith('auction:listing-1');
    });

    it('should return null when auction not in Redis', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.getAuctionState('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getStateDto', () => {
    it('should return AuctionStateDto from Redis state', async () => {
      const state = createAuctionState();
      redis.get.mockResolvedValue(JSON.stringify(state));

      const result = await service.getStateDto('listing-1');

      expect(result.auctionId).toBe('auction_test_123');
      expect(result.listingId).toBe('listing-1');
      expect(result.status).toBe('LIVE');
      expect(result.currentPrice).toBe(10000);
    });

    it('should throw error when auction not found', async () => {
      redis.get.mockResolvedValue(null);

      await expect(service.getStateDto('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate time remaining correctly', async () => {
      const now = Date.now();
      const state = createAuctionState({
        endsAt: now + 300000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));

      const result = await service.getStateDto('listing-1');

      expect(result.timeRemaining).toBeGreaterThan(0);
      expect(result.timeRemaining).toBeLessThanOrEqual(300000);
    });

    it('should return zero time remaining for ended auctions', async () => {
      const state = createAuctionState({
        endsAt: Date.now() - 1000,
      });
      redis.get.mockResolvedValue(JSON.stringify(state));

      const result = await service.getStateDto('listing-1');

      expect(result.timeRemaining).toBe(0);
    });
  });

  describe('getLiveAuctions', () => {
    it('should return only live and extended auctions', async () => {
      const liveState = createAuctionState({
        listingId: 'listing-1',
        status: AuctionStatus.LIVE,
        endsAt: Date.now() + 600000,
      });
      const extendedState = createAuctionState({
        listingId: 'listing-2',
        status: AuctionStatus.EXTENDED,
        endsAt: Date.now() + 300000,
      });
      const endedState = createAuctionState({
        listingId: 'listing-3',
        status: AuctionStatus.ENDED,
      });

      redis.keys.mockResolvedValue([
        'auction:listing-1',
        'auction:listing-2',
        'auction:listing-3',
      ]);
      redis.get
        .mockResolvedValueOnce(JSON.stringify(liveState))
        .mockResolvedValueOnce(JSON.stringify(extendedState))
        .mockResolvedValueOnce(JSON.stringify(endedState));

      const result = await service.getLiveAuctions();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('EXTENDED');
      expect(result[1].status).toBe('LIVE');
    });

    it('should return empty array when no auctions exist', async () => {
      redis.keys.mockResolvedValue([]);

      const result = await service.getLiveAuctions();

      expect(result).toEqual([]);
    });

    it('should sort by time remaining ascending', async () => {
      const soonState = createAuctionState({
        listingId: 'listing-1',
        status: AuctionStatus.LIVE,
        endsAt: Date.now() + 100000,
      });
      const laterState = createAuctionState({
        listingId: 'listing-2',
        status: AuctionStatus.LIVE,
        endsAt: Date.now() + 600000,
      });

      redis.keys.mockResolvedValue(['auction:listing-1', 'auction:listing-2']);
      redis.get
        .mockResolvedValueOnce(JSON.stringify(soonState))
        .mockResolvedValueOnce(JSON.stringify(laterState));

      const result = await service.getLiveAuctions();

      expect(result[0].timeRemaining).toBeLessThanOrEqual(
        result[1].timeRemaining,
      );
    });
  });

  describe('calculateMinIncrement', () => {
    it('should return 500 DZD minimum for low prices', () => {
      const result = (service as any).calculateMinIncrement(1000);

      expect(result).toBe(500);
    });

    it('should return 2% increment for higher prices', () => {
      const result = (service as any).calculateMinIncrement(50000);

      expect(result).toBe(1000);
    });

    it('should round up to nearest 100', () => {
      const result = (service as any).calculateMinIncrement(30000);

      expect(result).toBe(600);
    });

    it('should use percentage when it exceeds 500 DZD', () => {
      const result = (service as any).calculateMinIncrement(100000);

      expect(result).toBe(2000);
    });
  });
});
