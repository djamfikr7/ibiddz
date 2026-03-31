import { ListingCondition, ListingStatus } from '@ibiddz/shared'

export type ConditionGrade = ListingCondition
export type Status = ListingStatus
export type AuctionTypeEnum = 'ENGLISH' | 'DUTCH' | 'SEALED'

export interface ListingEntity {
  id: string
  sellerId: string
  title: string
  description: string
  model: string
  storageGB: number
  color: string
  condition: ListingCondition
  batteryHealth: number
  imeiHash: string | null
  accessories: string[] | null
  originalBox: boolean
  warrantyRemaining: number
  startingPrice: number
  buyNowPrice: number | null
  reservePrice: number | null
  currentBid: number | null
  bidCount: number
  auctionType: AuctionTypeEnum
  auctionStart: Date | null
  auctionEnd: Date | null
  durationMinutes: number | null
  hasBuyNow: boolean
  acceptOffers: boolean
  photos: string[]
  coverPhoto: string
  videoUrl: string | null
  status: ListingStatus
  rejectionReason: string | null
  viewCount: number
  favoriteCount: number
  featured: boolean
  featuredUntil: Date | null
  wilaya: string
  city: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface ListingWithSeller extends ListingEntity {
  seller: {
    id: string
    phone: string
    displayName: string | null
    avatarUrl: string | null
    trustScore: number
    role: string
    cnieVerified: boolean
    strikeCount: number
    createdAt: Date
    _count: {
      listings: number
    }
  }
  _count: {
    bids: number
    orders: number
  }
}

export interface CreateListingInput {
  title: string
  description: string
  model: string
  storageGB: number
  color: string
  condition: ListingCondition
  batteryHealth: number
  imei: string
  startingPrice: number
  buyNowPrice?: number
  reservePrice?: number
  photos: string[]
  wilaya: string
  city?: string
  accessories?: string[]
  originalBox?: boolean
  warrantyRemaining?: number
  auctionType?: AuctionTypeEnum
  auctionStart?: string
  auctionEnd?: string
  durationMinutes?: number
  hasBuyNow?: boolean
  acceptOffers?: boolean
  videoUrl?: string
}

export interface UpdateListingInput {
  title?: string
  description?: string
  model?: string
  storageGB?: number
  color?: string
  condition?: ListingCondition
  batteryHealth?: number
  startingPrice?: number
  buyNowPrice?: number
  reservePrice?: number
  photos?: string[]
  wilaya?: string
  city?: string
  accessories?: string[]
  originalBox?: boolean
  warrantyRemaining?: number
  featured?: boolean
  status?: ListingStatus
  videoUrl?: string
}

export interface ListingFilters {
  search?: string
  model?: string
  storageGB?: number
  condition?: ListingCondition
  minBatteryHealth?: number
  maxBatteryHealth?: number
  minPrice?: number
  maxPrice?: number
  wilaya?: string
  status?: ListingStatus
  featured?: boolean
}

export interface ListingSortOptions {
  sortBy: 'createdAt' | 'price' | 'batteryHealth' | 'trustScore' | 'viewCount'
  sortOrder: 'asc' | 'desc'
}

export interface PaginationOptions {
  limit: number
  offset: number
  cursor?: string
}

export interface AiPriceSuggestion {
  low: number
  high: number
  median: number
  confidence: number
}

export interface CommissionEstimate {
  commission: number
  netPayout: number
  breakdown: {
    baseRate: number
    tierDiscount: number
    auctionSurcharge: number
    finalRate: number
  }
}
