
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  phone: 'phone',
  phoneVerified: 'phoneVerified',
  trustScore: 'trustScore',
  strikeCount: 'strikeCount',
  banStatus: 'banStatus',
  walletDZD: 'walletDZD',
  role: 'role',
  displayName: 'displayName',
  avatarUrl: 'avatarUrl',
  bio: 'bio',
  cnieNumber: 'cnieNumber',
  cnieFrontUrl: 'cnieFrontUrl',
  cnieBackUrl: 'cnieBackUrl',
  cnieVerified: 'cnieVerified',
  cnieVerifiedAt: 'cnieVerifiedAt',
  deviceFingerprint: 'deviceFingerprint',
  lastDeviceFingerprint: 'lastDeviceFingerprint',
  lastLoginAt: 'lastLoginAt',
  lastLoginIp: 'lastLoginIp',
  subscriptionStart: 'subscriptionStart',
  subscriptionEnd: 'subscriptionEnd',
  subscriptionTier: 'subscriptionTier',
  broadcastCredits: 'broadcastCredits',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ListingScalarFieldEnum = {
  id: 'id',
  sellerId: 'sellerId',
  title: 'title',
  description: 'description',
  model: 'model',
  storageGB: 'storageGB',
  color: 'color',
  condition: 'condition',
  batteryHealth: 'batteryHealth',
  imeiHash: 'imeiHash',
  accessories: 'accessories',
  originalBox: 'originalBox',
  warrantyRemaining: 'warrantyRemaining',
  startingPrice: 'startingPrice',
  buyNowPrice: 'buyNowPrice',
  reservePrice: 'reservePrice',
  currentBid: 'currentBid',
  bidCount: 'bidCount',
  auctionType: 'auctionType',
  auctionStart: 'auctionStart',
  auctionEnd: 'auctionEnd',
  durationMinutes: 'durationMinutes',
  hasBuyNow: 'hasBuyNow',
  acceptOffers: 'acceptOffers',
  photos: 'photos',
  coverPhoto: 'coverPhoto',
  videoUrl: 'videoUrl',
  watermarks: 'watermarks',
  status: 'status',
  rejectionReason: 'rejectionReason',
  viewCount: 'viewCount',
  favoriteCount: 'favoriteCount',
  featured: 'featured',
  featuredUntil: 'featuredUntil',
  wilaya: 'wilaya',
  city: 'city',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BidScalarFieldEnum = {
  id: 'id',
  listingId: 'listingId',
  userId: 'userId',
  amount: 'amount',
  bidType: 'bidType',
  proxyMaxAmount: 'proxyMaxAmount',
  isAutoBid: 'isAutoBid',
  triggeredByProxy: 'triggeredByProxy',
  parentProxyBidId: 'parentProxyBidId',
  wasWinning: 'wasWinning',
  outbidAt: 'outbidAt',
  ipAddress: 'ipAddress',
  deviceInfo: 'deviceInfo',
  createdAt: 'createdAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  listingId: 'listingId',
  buyerId: 'buyerId',
  sellerId: 'sellerId',
  finalPrice: 'finalPrice',
  commissionAmount: 'commissionAmount',
  shippingCost: 'shippingCost',
  totalAmount: 'totalAmount',
  paymentMethod: 'paymentMethod',
  codAmount: 'codAmount',
  codToken: 'codToken',
  paymentRef: 'paymentRef',
  paidAt: 'paidAt',
  courierName: 'courierName',
  courierRef: 'courierRef',
  shippingAddress: 'shippingAddress',
  shippedAt: 'shippedAt',
  deliveredAt: 'deliveredAt',
  status: 'status',
  cancelledReason: 'cancelledReason',
  cancelledAt: 'cancelledAt',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  reviewerId: 'reviewerId',
  targetId: 'targetId',
  rating: 'rating',
  tags: 'tags',
  comment: 'comment',
  isPublic: 'isPublic',
  isVerified: 'isVerified',
  flagged: 'flagged',
  flaggedReason: 'flaggedReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BroadcastScalarFieldEnum = {
  id: 'id',
  senderId: 'senderId',
  channel: 'channel',
  status: 'status',
  audienceType: 'audienceType',
  audienceFilter: 'audienceFilter',
  recipientIds: 'recipientIds',
  title: 'title',
  content: 'content',
  mediaUrl: 'mediaUrl',
  actionUrl: 'actionUrl',
  creditCost: 'creditCost',
  creditsDeducted: 'creditsDeducted',
  scheduledAt: 'scheduledAt',
  sentAt: 'sentAt',
  sentCount: 'sentCount',
  deliveredCount: 'deliveredCount',
  openedCount: 'openedCount',
  clickedCount: 'clickedCount',
  convertedCount: 'convertedCount',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FollowScalarFieldEnum = {
  id: 'id',
  followerId: 'followerId',
  followingId: 'followingId',
  notifyOnListing: 'notifyOnListing',
  notifyOnAuction: 'notifyOnAuction',
  notifyOnSale: 'notifyOnSale',
  createdAt: 'createdAt'
};

exports.Prisma.OTPVerificationScalarFieldEnum = {
  id: 'id',
  phone: 'phone',
  code: 'code',
  method: 'method',
  expiresAt: 'expiresAt',
  attempts: 'attempts',
  maxAttempts: 'maxAttempts',
  verified: 'verified',
  verifiedAt: 'verifiedAt',
  ipAddress: 'ipAddress',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.CommissionLedgerScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  commissionAmount: 'commissionAmount',
  platformFee: 'platformFee',
  paymentFee: 'paymentFee',
  netToSeller: 'netToSeller',
  breakdown: 'breakdown',
  settled: 'settled',
  settledAt: 'settledAt',
  settlementRef: 'settlementRef',
  createdAt: 'createdAt'
};

exports.Prisma.PayoutRequestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  amount: 'amount',
  method: 'method',
  payoutDetails: 'payoutDetails',
  status: 'status',
  processedBy: 'processedBy',
  processedAt: 'processedAt',
  rejectionReason: 'rejectionReason',
  reference: 'reference',
  transactionId: 'transactionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DisputeScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  reporterId: 'reporterId',
  targetId: 'targetId',
  reason: 'reason',
  category: 'category',
  description: 'description',
  evidence: 'evidence',
  status: 'status',
  resolution: 'resolution',
  resolutionNotes: 'resolutionNotes',
  resolvedBy: 'resolvedBy',
  resolvedAt: 'resolvedAt',
  trustImpact: 'trustImpact',
  trustApplied: 'trustApplied',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourierWebhookScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  event: 'event',
  payload: 'payload',
  processed: 'processed',
  processedAt: 'processedAt',
  retryCount: 'retryCount',
  maxRetries: 'maxRetries',
  lastError: 'lastError',
  createdAt: 'createdAt'
};

exports.Prisma.BroadcastAnalyticsScalarFieldEnum = {
  id: 'id',
  broadcastId: 'broadcastId',
  impressions: 'impressions',
  clicks: 'clicks',
  conversions: 'conversions',
  uniqueUsers: 'uniqueUsers',
  userId: 'userId',
  delivered: 'delivered',
  deliveredAt: 'deliveredAt',
  opened: 'opened',
  openedAt: 'openedAt',
  clicked: 'clicked',
  clickedAt: 'clickedAt',
  converted: 'converted',
  convertedAt: 'convertedAt',
  device: 'device',
  platform: 'platform',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ModerationQueueScalarFieldEnum = {
  id: 'id',
  listingId: 'listingId',
  userId: 'userId',
  reason: 'reason',
  category: 'category',
  description: 'description',
  evidence: 'evidence',
  reporterId: 'reporterId',
  reporterPhone: 'reporterPhone',
  status: 'status',
  action: 'action',
  actionNotes: 'actionNotes',
  moderatorId: 'moderatorId',
  reviewedAt: 'reviewedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  adminId: 'adminId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  changes: 'changes',
  reason: 'reason',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  channel: 'channel',
  title: 'title',
  body: 'body',
  data: 'data',
  actionUrl: 'actionUrl',
  read: 'read',
  readAt: 'readAt',
  clicked: 'clicked',
  clickedAt: 'clickedAt',
  sent: 'sent',
  sentAt: 'sentAt',
  delivered: 'delivered',
  deliveredAt: 'deliveredAt',
  deliveryError: 'deliveryError',
  scheduledFor: 'scheduledFor',
  createdAt: 'createdAt'
};

exports.Prisma.ConversationScalarFieldEnum = {
  id: 'id',
  buyerId: 'buyerId',
  sellerId: 'sellerId',
  listingId: 'listingId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  senderId: 'senderId',
  content: 'content',
  type: 'type',
  imageUrl: 'imageUrl',
  read: 'read',
  readAt: 'readAt',
  createdAt: 'createdAt'
};

exports.Prisma.BlockScalarFieldEnum = {
  id: 'id',
  blockerId: 'blockerId',
  blockedId: 'blockedId',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.BanStatus = exports.$Enums.BanStatus = {
  NONE: 'NONE',
  WARNING: 'WARNING',
  TEMPORARY: 'TEMPORARY',
  PERMANENT: 'PERMANENT'
};

exports.UserRole = exports.$Enums.UserRole = {
  BASICO: 'BASICO',
  PRO: 'PRO',
  CERTIFIE: 'CERTIFIE',
  ELITE: 'ELITE',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  FINANCE: 'FINANCE',
  SUPPORT: 'SUPPORT',
  COURIER_LIAISON: 'COURIER_LIAISON'
};

exports.ListingCondition = exports.$Enums.ListingCondition = {
  LIKE_NEW: 'LIKE_NEW',
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR: 'FAIR'
};

exports.AuctionType = exports.$Enums.AuctionType = {
  LIVE: 'LIVE',
  TIMED: 'TIMED',
  BUY_NOW: 'BUY_NOW',
  OFFER: 'OFFER'
};

exports.ListingStatus = exports.$Enums.ListingStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  SOLD: 'SOLD',
  EXPIRED: 'EXPIRED',
  REMOVED: 'REMOVED',
  REJECTED: 'REJECTED'
};

exports.BidType = exports.$Enums.BidType = {
  MANUAL: 'MANUAL',
  PROXY: 'PROXY',
  AUTO: 'AUTO'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  COD: 'COD',
  CCP: 'CCP',
  EDAHABIA: 'EDAHABIA',
  BANK_TRANSFER: 'BANK_TRANSFER',
  WALLET: 'WALLET'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  DISPUTED: 'DISPUTED'
};

exports.BroadcastChannel = exports.$Enums.BroadcastChannel = {
  PUSH: 'PUSH',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  IN_APP: 'IN_APP',
  WHATSAPP: 'WHATSAPP'
};

exports.BroadcastStatus = exports.$Enums.BroadcastStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

exports.VerificationMethod = exports.$Enums.VerificationMethod = {
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
  VOICE: 'VOICE'
};

exports.PayoutMethod = exports.$Enums.PayoutMethod = {
  CCP: 'CCP',
  EDAHABIA: 'EDAHABIA',
  BANK: 'BANK'
};

exports.PayoutStatus = exports.$Enums.PayoutStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

exports.DisputeStatus = exports.$Enums.DisputeStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  ESCALATED: 'ESCALATED'
};

exports.DisputeResolution = exports.$Enums.DisputeResolution = {
  BUYER_FAVOR: 'BUYER_FAVOR',
  SELLER_FAVOR: 'SELLER_FAVOR',
  PARTIAL_REFUND: 'PARTIAL_REFUND',
  FULL_REFUND: 'FULL_REFUND',
  NO_ACTION: 'NO_ACTION'
};

exports.ModerationStatus = exports.$Enums.ModerationStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ACTION_TAKEN: 'ACTION_TAKEN'
};

exports.ModerationAction = exports.$Enums.ModerationAction = {
  NONE: 'NONE',
  WARNING: 'WARNING',
  SUSPEND_LISTING: 'SUSPEND_LISTING',
  SUSPEND_USER: 'SUSPEND_USER',
  REQUIRE_VERIFICATION: 'REQUIRE_VERIFICATION',
  PERMANENT_BAN: 'PERMANENT_BAN'
};

exports.AuditAction = exports.$Enums.AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  SUSPEND: 'SUSPEND',
  UNSUSPEND: 'UNSUSPEND',
  REFUND: 'REFUND',
  PAYOUT_APPROVE: 'PAYOUT_APPROVE',
  PAYOUT_REJECT: 'PAYOUT_REJECT',
  DISPUTE_RESOLVE: 'DISPUTE_RESOLVE',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ROLE_CHANGE: 'ROLE_CHANGE'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  BID_PLACED: 'BID_PLACED',
  BID_OUTBID: 'BID_OUTBID',
  AUCTION_WON: 'AUCTION_WON',
  AUCTION_LOST: 'AUCTION_LOST',
  LISTING_APPROVED: 'LISTING_APPROVED',
  LISTING_REJECTED: 'LISTING_REJECTED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_SHIPPED: 'ORDER_SHIPPED',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYOUT_PROCESSED: 'PAYOUT_PROCESSED',
  DISPUTE_OPENED: 'DISPUTE_OPENED',
  DISPUTE_RESOLVED: 'DISPUTE_RESOLVED',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
  BROADCAST: 'BROADCAST',
  FOLLOW: 'FOLLOW',
  REVIEW_RECEIVED: 'REVIEW_RECEIVED',
  VERIFICATION_SUCCESS: 'VERIFICATION_SUCCESS',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  STRIKE_WARNING: 'STRIKE_WARNING'
};

exports.NotificationChannel = exports.$Enums.NotificationChannel = {
  PUSH: 'PUSH',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  IN_APP: 'IN_APP'
};

exports.MessageType = exports.$Enums.MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  SYSTEM: 'SYSTEM'
};

exports.Prisma.ModelName = {
  User: 'User',
  Listing: 'Listing',
  Bid: 'Bid',
  Order: 'Order',
  Review: 'Review',
  Broadcast: 'Broadcast',
  Follow: 'Follow',
  OTPVerification: 'OTPVerification',
  CommissionLedger: 'CommissionLedger',
  PayoutRequest: 'PayoutRequest',
  Dispute: 'Dispute',
  CourierWebhook: 'CourierWebhook',
  BroadcastAnalytics: 'BroadcastAnalytics',
  ModerationQueue: 'ModerationQueue',
  AuditLog: 'AuditLog',
  Notification: 'Notification',
  Conversation: 'Conversation',
  Message: 'Message',
  Block: 'Block'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
