import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import {
  COMMISSION,
  TIER_DISCOUNTS,
  AUCTION_SURCHARGE,
  CONDITION_GRADES,
  IMAGE_LIMITS,
  PAGINATION,
} from '@ibiddz/shared'
import {
  validateIMEI,
  validateBatteryHealth,
  validateConditionGrade,
  validateWilaya,
  sanitizeText,
} from '@ibiddz/shared'
import { CreateListingDto } from './dto/create-listing.dto'
import { UpdateListingDto } from './dto/update-listing.dto'
import { ListingQueryDto } from './dto/listing-query.dto'
import {
  ListingResponseDto,
  PaginatedListingsResponse,
  ListingDetailResponse,
  SellerInfoDto,
} from './dto/listing-response.dto'
import {
  ListingEntity,
  CreateListingInput,
  UpdateListingInput,
  AiPriceSuggestion,
  CommissionEstimate,
} from './entities/listing.entity'
import { createHash } from 'crypto'

@Injectable()
export class ListingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListingQueryDto,
    currentUser?: { userId: string; role: string },
  ): Promise<PaginatedListingsResponse> {
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT
    const offset = query.offset ?? 0
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'

    const where: Record<string, unknown> = {}

    if (!isAdmin) {
      where.status = query.status ?? 'ACTIVE'
    } else if (query.status) {
      where.status = query.status
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.model) {
      where.model = { contains: query.model, mode: 'insensitive' }
    }

    if (query.storageGB) {
      where.storageGB = query.storageGB
    }

    if (query.condition) {
      where.condition = query.condition
    }

    if (query.minBatteryHealth !== undefined || query.maxBatteryHealth !== undefined) {
      const batteryFilter: Record<string, unknown> = {}
      if (query.minBatteryHealth !== undefined) {
        batteryFilter.gte = query.minBatteryHealth
      }
      if (query.maxBatteryHealth !== undefined) {
        batteryFilter.lte = query.maxBatteryHealth
      }
      where.batteryHealth = batteryFilter
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, unknown> = {}
      if (query.minPrice !== undefined) {
        priceFilter.gte = query.minPrice
      }
      if (query.maxPrice !== undefined) {
        priceFilter.lte = query.maxPrice
      }
      where.startingPrice = priceFilter
    }

    if (query.wilaya) {
      where.wilaya = { equals: query.wilaya, mode: 'insensitive' }
    }

    if (query.featured === 'true') {
      where.featured = true
      where.featuredUntil = { gte: new Date() }
    }

    const orderBy = this.buildOrderBy(query.sortBy, query.sortOrder)

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              phone: true,
              displayName: true,
              avatarUrl: true,
              trustScore: true,
              role: true,
              cnieVerified: true,
              strikeCount: true,
              createdAt: true,
              _count: {
                select: { listings: { where: { status: 'ACTIVE' } } },
              },
            },
          },
          _count: {
            select: { bids: true, orders: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ])

    const data = await Promise.all(listings.map((listing) => this.mapToListingResponse(listing)))
    const hasMore = offset + listings.length < total
    const nextCursor = hasMore
      ? Buffer.from(`${offset + limit}`).toString('base64')
      : null

    return {
      data,
      total,
      limit,
      offset,
      nextCursor,
      hasNextPage: hasMore,
    }
  }

  async findOne(
    id: string,
    currentUser?: { userId: string; role: string },
  ): Promise<ListingDetailResponse> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            phone: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            role: true,
            cnieVerified: true,
            strikeCount: true,
            createdAt: true,
            _count: {
              select: { listings: { where: { status: 'ACTIVE' } } },
            },
          },
        },
        _count: {
          select: { bids: true, orders: true },
        },
      },
    })

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`)
    }

    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
    const isOwner = currentUser?.userId === listing.sellerId

    if (listing.status === 'REMOVED' && !isAdmin && !isOwner) {
      throw new NotFoundException(`Listing with ID ${id} not found`)
    }

    if (listing.status === 'DRAFT' && !isOwner && !isAdmin) {
      throw new NotFoundException(`Listing with ID ${id} not found`)
    }

    await this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    const response = await this.mapToListingResponse(listing) as ListingDetailResponse
    response.rejectionReason = listing.rejectionReason
    response.metadata = listing.metadata as Record<string, unknown> | null

    const aiSuggestion = this.generateAiPriceSuggestion(listing)
    response.aiPriceSuggestion = aiSuggestion ?? undefined

    return response
  }

  async create(
    dto: CreateListingDto,
    userId: string,
  ): Promise<ListingDetailResponse> {
    const imeiHash = this.hashImei(dto.imei)

    const existing = await this.prisma.listing.findFirst({
      where: { imeiHash },
    })
    if (existing) {
      throw new BadRequestException('Duplicate IMEI')
    }

    const listing = await this.prisma.listing.create({
      data: {
        sellerId: userId,
        title: dto.title,
        description: dto.description,
        model: dto.model,
        storageGB: dto.storageGB,
        color: dto.color,
        condition: dto.condition,
        batteryHealth: dto.batteryHealth,
        imeiHash,
        startingPrice: dto.startingPrice,
        buyNowPrice: dto.buyNowPrice,
        reservePrice: dto.reservePrice,
        photos: dto.photos,
        wilaya: dto.wilaya,
        city: dto.city,
        accessories: dto.accessories ?? [],
        originalBox: dto.originalBox ?? false,
        warrantyRemaining: dto.warrantyRemaining ?? 0,
        auctionType: dto.auctionType ?? 'BUY_NOW',
        auctionStart: dto.auctionStart ? new Date(dto.auctionStart) : null,
        auctionEnd: dto.auctionEnd ? new Date(dto.auctionEnd) : null,
        durationMinutes: dto.durationMinutes,
        hasBuyNow: dto.hasBuyNow ?? false,
        acceptOffers: dto.acceptOffers ?? false,
        videoUrl: dto.videoUrl,
        coverPhoto: dto.photos[0] || '',
        status: 'PENDING_APPROVAL',
      },
      include: {
        seller: {
          select: {
            id: true,
            phone: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            role: true,
            cnieVerified: true,
            strikeCount: true,
            createdAt: true,
          },
        },
        _count: {
          select: { bids: true, orders: true },
        },
      },
    })

    const listingWithRelations = await this.prisma.listing.findUnique({
      where: { id: listing.id },
      include: {
        seller: {
          select: {
            id: true,
            phone: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            role: true,
            cnieVerified: true,
            strikeCount: true,
            createdAt: true,
          },
        },
        _count: {
          select: { bids: true, orders: true },
        },
      },
    })

    return await this.mapToListingResponse(listingWithRelations!) as ListingDetailResponse
  }

  async update(
    id: string,
    dto: UpdateListingDto,
    userId: string,
  ): Promise<ListingDetailResponse> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { seller: true },
    })

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`)
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own listings')
    }

    if (listing.status === 'SOLD' || listing.status === 'EXPIRED') {
      throw new BadRequestException('Cannot update a sold or expired listing')
    }

    const updateData: Record<string, unknown> = {}

    if (dto.title !== undefined) {
      updateData.title = sanitizeText(dto.title, 120)
    }

    if (dto.description !== undefined) {
      updateData.description = sanitizeText(dto.description, 2000)
    }

    if (dto.model !== undefined) {
      updateData.model = dto.model
    }

    if (dto.storageGB !== undefined) {
      updateData.storageGB = dto.storageGB
    }

    if (dto.color !== undefined) {
      updateData.color = dto.color
    }

    if (dto.condition !== undefined) {
      if (!validateConditionGrade(dto.condition as string)) {
        throw new BadRequestException('Invalid condition grade')
      }
      updateData.condition = dto.condition
    }

    if (dto.batteryHealth !== undefined) {
      if (!validateBatteryHealth(dto.batteryHealth)) {
        throw new BadRequestException('Battery health must be between 60-100%')
      }
      updateData.batteryHealth = dto.batteryHealth
    }

    if (dto.startingPrice !== undefined) {
      updateData.startingPrice = dto.startingPrice
    }

    if (dto.buyNowPrice !== undefined) {
      updateData.buyNowPrice = dto.buyNowPrice
    }

    if (dto.reservePrice !== undefined) {
      updateData.reservePrice = dto.reservePrice
    }

    if (dto.photos !== undefined) {
      if (dto.photos.length < 1) {
        throw new BadRequestException('At least one photo is required')
      }
      if (dto.photos.length > IMAGE_LIMITS.MAX_LISTING_PHOTOS) {
        throw new BadRequestException(
          `Maximum ${IMAGE_LIMITS.MAX_LISTING_PHOTOS} photos allowed`,
        )
      }
      updateData.photos = dto.photos
      updateData.coverPhoto = dto.photos[0]
    }

    if (dto.wilaya !== undefined) {
      if (!validateWilaya(dto.wilaya)) {
        throw new BadRequestException('Invalid wilaya')
      }
      updateData.wilaya = dto.wilaya
    }

    if (dto.city !== undefined) {
      updateData.city = dto.city
    }

    if (dto.accessories !== undefined) {
      updateData.accessories = dto.accessories
    }

    if (dto.originalBox !== undefined) {
      updateData.originalBox = dto.originalBox
    }

    if (dto.warrantyRemaining !== undefined) {
      updateData.warrantyRemaining = dto.warrantyRemaining
    }

    if (dto.featured !== undefined) {
      updateData.featured = dto.featured
    }

    if (dto.status !== undefined) {
      if (['ACTIVE', 'PAUSED', 'SOLD', 'EXPIRED', 'REMOVED'].includes(dto.status)) {
        updateData.status = dto.status
      }
    }

    if (dto.videoUrl !== undefined) {
      updateData.videoUrl = dto.videoUrl
    }

    if (Object.keys(updateData).length === 0) {
      const currentListing = await this.prisma.listing.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              phone: true,
              displayName: true,
              avatarUrl: true,
              trustScore: true,
              role: true,
              cnieVerified: true,
              strikeCount: true,
              createdAt: true,
              _count: {
                select: { listings: { where: { status: 'ACTIVE' } } },
              },
            },
          },
          _count: {
            select: { bids: true, orders: true },
          },
        },
      })

      if (!currentListing) {
        throw new NotFoundException(`Listing with ID ${id} not found`)
      }

      const response = await this.mapToListingResponse(currentListing) as ListingDetailResponse
      response.rejectionReason = currentListing.rejectionReason
      response.metadata = currentListing.metadata as Record<string, unknown> | null
      return response
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            phone: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            role: true,
            cnieVerified: true,
            strikeCount: true,
            createdAt: true,
            _count: {
              select: { listings: { where: { status: 'ACTIVE' } } },
            },
          },
        },
        _count: {
          select: { bids: true, orders: true },
        },
      },
    })

    const response = await this.mapToListingResponse(updated) as ListingDetailResponse
    response.rejectionReason = updated.rejectionReason
    response.metadata = updated.metadata as Record<string, unknown> | null

    return response
  }

  async remove(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true, status: true },
    })

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`)
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own listings')
    }

    if (listing.status === 'SOLD') {
      throw new BadRequestException('Cannot delete a sold listing')
    }

    await this.prisma.listing.update({
      where: { id },
      data: { status: 'REMOVED' },
    })

    return { success: true, message: 'Listing removed successfully' }
  }

  async findMyListings(
    userId: string,
    query: ListingQueryDto,
  ): Promise<PaginatedListingsResponse> {
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT
    const offset = query.offset ?? 0

    const where: Record<string, unknown> = { sellerId: userId }

    if (query.status) {
      where.status = query.status
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const orderBy = this.buildOrderBy(query.sortBy, query.sortOrder)

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              phone: true,
              displayName: true,
              avatarUrl: true,
              trustScore: true,
              role: true,
              cnieVerified: true,
              strikeCount: true,
              createdAt: true,
              _count: {
                select: { listings: { where: { status: 'ACTIVE' } } },
              },
            },
          },
          _count: {
            select: { bids: true, orders: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ])

    const data = await Promise.all(listings.map((listing) => this.mapToListingResponse(listing)))
    const hasMore = offset + listings.length < total
    const nextCursor = hasMore
      ? Buffer.from(`${offset + limit}`).toString('base64')
      : null

    return {
      data,
      total,
      limit,
      offset,
      nextCursor,
      hasNextPage: hasMore,
    }
  }

  async estimateCommission(
    price: number,
    sellerRole: string,
    isAuction: boolean = false,
  ): Promise<CommissionEstimate> {
    const baseRate = COMMISSION.BASIC_RATE
    const tierDiscount = TIER_DISCOUNTS[sellerRole as keyof typeof TIER_DISCOUNTS] ?? 0
    const auctionSurcharge = isAuction ? AUCTION_SURCHARGE : 0

    const finalRate = baseRate * (1 - tierDiscount) + auctionSurcharge
    const commission = Math.min(
      Math.max(price * finalRate, COMMISSION.MIN_FEE),
      COMMISSION.MAX_FEE,
    )
    const netPayout = price - commission

    return {
      commission: Math.round(commission * 100) / 100,
      netPayout: Math.round(netPayout * 100) / 100,
      breakdown: {
        baseRate,
        tierDiscount,
        auctionSurcharge,
        finalRate: Math.round(finalRate * 10000) / 10000,
      },
    }
  }

  hashImei(imei: string): string {
    return createHash('sha256').update(imei.trim()).digest('hex')
  }

  private async mapToListingResponse(
    listing: Record<string, unknown> & {
      seller: Record<string, unknown>
      _count: { bids: number; orders: number }
    },
  ): Promise<ListingResponseDto> {
    const sellerInfo: SellerInfoDto = {
      id: listing.seller.id as string,
      phone: listing.seller.phone as string,
      displayName: listing.seller.displayName as string | null,
      avatarUrl: listing.seller.avatarUrl as string | null,
      trustScore: listing.seller.trustScore as number,
      role: listing.seller.role as string,
      cnieVerified: listing.seller.cnieVerified as boolean,
      strikeCount: listing.seller.strikeCount as number,
      createdAt: (listing.seller.createdAt as Date).toISOString(),
    }

    const commission = await this.estimateCommission(
      listing.startingPrice as number,
      listing.seller.role as string,
      listing.auctionType !== 'BUY_NOW',
    )

    return {
      id: listing.id as string,
      sellerId: listing.sellerId as string,
      title: listing.title as string,
      description: listing.description as string,
      model: listing.model as string,
      storageGB: listing.storageGB as number,
      color: listing.color as string,
      condition: listing.condition as string,
      batteryHealth: listing.batteryHealth as number,
      imeiHash: listing.imeiHash as string | null,
      accessories: listing.accessories as string[] | null,
      originalBox: listing.originalBox as boolean,
      warrantyRemaining: listing.warrantyRemaining as number,
      startingPrice: listing.startingPrice as number,
      buyNowPrice: listing.buyNowPrice as number | null,
      reservePrice: listing.reservePrice as number | null,
      currentBid: listing.currentBid as number | null,
      bidCount: listing.bidCount as number,
      auctionType: listing.auctionType as string,
      auctionStart: listing.auctionStart
        ? (listing.auctionStart as Date).toISOString()
        : null,
      auctionEnd: listing.auctionEnd
        ? (listing.auctionEnd as Date).toISOString()
        : null,
      durationMinutes: listing.durationMinutes as number | null,
      hasBuyNow: listing.hasBuyNow as boolean,
      acceptOffers: listing.acceptOffers as boolean,
      photos: listing.photos as string[],
      coverPhoto: listing.coverPhoto as string,
      videoUrl: listing.videoUrl as string | null,
      status: listing.status as string,
      rejectionReason: listing.rejectionReason as string | null,
      viewCount: listing.viewCount as number,
      favoriteCount: listing.favoriteCount as number,
      featured: listing.featured as boolean,
      featuredUntil: listing.featuredUntil
        ? (listing.featuredUntil as Date).toISOString()
        : null,
      wilaya: listing.wilaya as string,
      city: listing.city as string | null,
      createdAt: (listing.createdAt as Date).toISOString(),
      updatedAt: (listing.updatedAt as Date).toISOString(),
      seller: sellerInfo,
      requiresModeration: listing.status === 'PENDING_APPROVAL',
      estimatedCommission: commission.commission,
      estimatedNetPayout: commission.netPayout,
    }
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: string,
  ): Record<string, unknown>[] {
    const field = sortBy ?? 'createdAt'
    const order = sortOrder ?? 'desc'

    const prismaFieldMap: Record<string, string> = {
      createdAt: 'createdAt',
      price: 'startingPrice',
      batteryHealth: 'batteryHealth',
      trustScore: 'seller___trustScore',
      viewCount: 'viewCount',
    }

    const prismaField = prismaFieldMap[field] ?? 'createdAt'

    if (prismaField.includes('___')) {
      const [relation, field] = prismaField.split('___')
      return [{ [relation]: { [field]: order } }]
    }

    return [{ [prismaField]: order }]
  }

  private generateAiPriceSuggestion(
    listing: Record<string, unknown>,
  ): { low: number; high: number; median: number; confidence: number } | null {
    const model = listing.model as string
    const storageGB = listing.storageGB as number
    const condition = listing.condition as string
    const batteryHealth = listing.batteryHealth as number

    const basePrices: Record<string, number> = {
      'iPhone 15 Pro Max': 180000,
      'iPhone 15 Pro': 150000,
      'iPhone 15': 120000,
      'iPhone 14 Pro Max': 150000,
      'iPhone 14 Pro': 130000,
      'iPhone 14': 100000,
      'iPhone 13 Pro Max': 120000,
      'iPhone 13 Pro': 100000,
      'iPhone 13': 80000,
      'iPhone 12 Pro Max': 90000,
      'iPhone 12 Pro': 75000,
      'iPhone 12': 60000,
      'iPhone 11 Pro Max': 70000,
      'iPhone 11 Pro': 60000,
      'iPhone 11': 50000,
      'iPhone SE': 35000,
    }

    let basePrice = 50000

    for (const [key, price] of Object.entries(basePrices)) {
      if (model.toLowerCase().includes(key.toLowerCase())) {
        basePrice = price
        break
      }
    }

    const storageMultiplier = storageGB >= 512 ? 1.15 : storageGB >= 256 ? 1.05 : 1
    const conditionMultiplier =
      condition === 'LIKE_NEW'
        ? 1.1
        : condition === 'EXCELLENT'
          ? 1.0
          : condition === 'GOOD'
            ? 0.85
            : 0.7
    const batteryMultiplier = 0.8 + (batteryHealth / 100) * 0.2

    const median = Math.round(
      basePrice * storageMultiplier * conditionMultiplier * batteryMultiplier,
    )
    const low = Math.round(median * 0.85)
    const high = Math.round(median * 1.15)
    const confidence = Math.round(
      (0.6 + (batteryHealth / 100) * 0.3 + (condition === 'LIKE_NEW' ? 0.1 : 0)) * 100,
    ) / 100

    return {
      low,
      high,
      median,
      confidence: Math.min(confidence, 0.95),
    }
  }
}
