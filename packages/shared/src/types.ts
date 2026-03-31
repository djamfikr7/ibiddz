export enum UserRole {
  BASICO = "BASICO",
  PRO = "PRO",
  CERTIFIE = "CERTIFIE",
  ELITE = "ELITE",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  SUPPORT = "SUPPORT",
}

export enum ListingCondition {
  LIKE_NEW = "LIKE_NEW",
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
}

export enum ListingStatus {
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum OrderStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  RETURNED = "RETURNED",
}

export enum AuctionStatus {
  SCHEDULED = "SCHEDULED",
  LIVE = "LIVE",
  EXTENDED = "EXTENDED",
  ENDED = "ENDED",
  CANCELLED = "CANCELLED",
}

export enum BroadcastChannel {
  ADMIN_ANNOUNCE = "ADMIN_ANNOUNCE",
  SELLER_POST = "SELLER_POST",
  BUYER_ALERT = "BUYER_ALERT",
  AUCTION_LIVE = "AUCTION_LIVE",
}

export type TrustTier = "NEW" | "ACTIVE" | "TRUSTED" | "ELITE";

export enum CourierEvent {
  CREATED = "CREATED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
}

export enum DisputeStatus {
  OPEN = "OPEN",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED = "RESOLVED",
  ESCALATED = "ESCALATED",
  CLOSED = "CLOSED",
}

export enum PayoutMethod {
  CCP = "CCP",
  EDAHABIA = "EDAHABIA",
  BANK = "BANK",
}

export enum PayoutStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface UserPublic {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  trustScore: number;
  trustTier: TrustTier;
  verified: boolean;
  memberSince: Date;
  totalSales: number;
  totalPurchases: number;
  avgRating: number;
  ratingCount: number;
  wilaya: string;
}

export interface ListingPublic {
  id: string;
  title: string;
  description: string;
  condition: ListingCondition;
  batteryHealth: number | null;
  storage: string;
  model: string;
  color: string;
  imeiHash: string;
  price: number;
  photos: string[];
  seller: UserPublic;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  wilaya: string;
}

export interface AuctionState {
  id: string;
  listingId: string;
  title: string;
  model: string;
  startingPrice: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  bidCount: number;
  startTime: Date;
  endTime: Date;
  status: AuctionStatus;
  extended: boolean;
  seller: UserPublic;
  photos: string[];
  condition: ListingCondition;
  batteryHealth: number | null;
  watchers: number;
}

export interface OrderPublic {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  commission: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  courierTracking: string | null;
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery: Date | null;
}

export interface TrustBreakdown {
  score: number;
  tier: TrustTier;
  badge: string;
  color: string;
  completedSales: number;
  ratings: number;
  accountAgeDays: number;
  verified: boolean;
  disputeRate: number;
  nextTierScore: number;
  nextTierName: string;
}
