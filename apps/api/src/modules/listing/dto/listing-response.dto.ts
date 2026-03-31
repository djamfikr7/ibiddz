import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ListingCondition } from '@ibiddz/shared'

export class SellerInfoDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string

  @ApiProperty({ example: '+213555123456' })
  phone: string

  @ApiPropertyOptional({ example: 'Ahmed' })
  displayName: string | null

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../avatar.jpg' })
  avatarUrl: string | null

  @ApiProperty({ example: 75 })
  trustScore: number

  @ApiProperty({ example: 'PRO' })
  role: string

  @ApiProperty({ example: true })
  cnieVerified: boolean

  @ApiProperty({ example: 0 })
  strikeCount: number

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: string

  @ApiPropertyOptional()
  _count?: { listings: number }
}

export class ListingResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string

  @ApiProperty({ example: 'clx0987654321' })
  sellerId: string

  @ApiProperty({ example: 'iPhone 15 Pro Max 256GB' })
  title: string

  @ApiProperty({ example: 'Excellent condition, barely used' })
  description: string

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  model: string

  @ApiProperty({ example: 256 })
  storageGB: number

  @ApiProperty({ example: 'Natural Titanium' })
  color: string

  @ApiProperty({ enum: ListingCondition, example: 'EXCELLENT' })
  condition: string

  @ApiProperty({ example: 89 })
  batteryHealth: number

  @ApiProperty({ example: 'a1b2c3d4...' })
  imeiHash: string | null

  @ApiPropertyOptional()
  accessories: string[] | null

  @ApiProperty({ example: true })
  originalBox: boolean

  @ApiProperty({ example: 0 })
  warrantyRemaining: number

  @ApiProperty({ example: 95000 })
  startingPrice: number

  @ApiPropertyOptional({ example: 120000 })
  buyNowPrice: number | null

  @ApiPropertyOptional({ example: 90000 })
  reservePrice: number | null

  @ApiPropertyOptional({ example: 95000 })
  currentBid: number | null

  @ApiProperty({ example: 0 })
  bidCount: number

  @ApiProperty({ example: 'BUY_NOW' })
  auctionType: string

  @ApiPropertyOptional({ example: '2024-03-15T10:00:00Z' })
  auctionStart: string | null

  @ApiPropertyOptional({ example: '2024-03-16T10:00:00Z' })
  auctionEnd: string | null

  @ApiPropertyOptional({ example: 1440 })
  durationMinutes: number | null

  @ApiProperty({ example: false })
  hasBuyNow: boolean

  @ApiProperty({ example: false })
  acceptOffers: boolean

  @ApiProperty({ example: ['https://res.cloudinary.com/...'] })
  photos: string[]

  @ApiProperty({ example: 'https://res.cloudinary.com/.../cover.jpg' })
  coverPhoto: string

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../video.mp4' })
  videoUrl: string | null

  @ApiProperty({
    enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'SOLD', 'EXPIRED', 'REMOVED', 'REJECTED'],
    example: 'ACTIVE',
  })
  status: string

  @ApiPropertyOptional({ example: 'Not meeting reserve price' })
  rejectionReason: string | null

  @ApiProperty({ example: 150 })
  viewCount: number

  @ApiProperty({ example: 12 })
  favoriteCount: number

  @ApiProperty({ example: false })
  featured: boolean

  @ApiPropertyOptional({ example: '2024-04-01T00:00:00Z' })
  featuredUntil: string | null

  @ApiProperty({ example: 'Alger' })
  wilaya: string

  @ApiPropertyOptional({ example: 'Bab Ezzouar' })
  city: string | null

  @ApiProperty({ example: '2024-03-10T10:00:00Z' })
  createdAt: string

  @ApiProperty({ example: '2024-03-10T10:00:00Z' })
  updatedAt: string

  @ApiProperty()
  seller: SellerInfoDto

  @ApiProperty({ example: false })
  requiresModeration: boolean

  @ApiProperty({ example: 4750 })
  estimatedCommission: number

  @ApiProperty({ example: 90250 })
  estimatedNetPayout: number

  @ApiPropertyOptional()
  _count?: { bids: number; orders: number }
}

export class ListingDetailResponse extends ListingResponseDto {
  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null

  @ApiPropertyOptional()
  aiPriceSuggestion?: {
    low: number
    high: number
    median: number
    confidence: number
  }
}

export class PaginatedListingsResponse {
  @ApiProperty({ type: [ListingResponseDto] })
  data: ListingResponseDto[]

  @ApiProperty({ example: 150 })
  total: number

  @ApiProperty({ example: 20 })
  limit: number

  @ApiProperty({ example: 0 })
  offset: number

  @ApiPropertyOptional({ example: 'next-cursor-token' })
  nextCursor: string | null

  @ApiProperty({ example: false })
  hasNextPage: boolean
}

export class PaginatedListingsResponseDto extends PaginatedListingsResponse {}
