# Blueprint API Audit Report — ALL RESOLVED ✅

**Project:** iBidDZ
**Date:** 2026-03-31
**Status:** All 11 endpoints match blueprint exactly

---

## Endpoint Registry

| # | Blueprint Endpoint | Auth | Status | File | Line |
|---|-------------------|------|--------|------|------|
| 1 | `POST /v1/auth/otp` | Public | ✅ | `modules/auth/auth.controller.ts` | 29 |
| 2 | `POST /v1/auth/verify` | Public | ✅ | `modules/auth/auth.controller.ts` | 50 |
| 3 | `GET /v1/listings` | Optional | ✅ | `modules/listing/listing.controller.ts` | 39 |
| 4 | `POST /v1/listings` | Seller | ✅ | `modules/listing/listing.controller.ts` | 62 |
| 5 | `POST /v1/bids` | Buyer | ✅ | `modules/auction/auction.controller.ts` | 68 |
| 6 | `POST /v1/orders` | Buyer | ✅ | `modules/order/order.controller.ts` | 33 |
| 7 | `POST /v1/webhooks/courier` | System | ✅ | `modules/courier/courier.controller.ts` | 30 |
| 8 | `POST /v1/cod/confirm` | Courier/Buyer | ✅ | `modules/order/order.controller.ts` | 67 |
| 9 | `GET /v1/user/trust` | User | ✅ | `modules/trust/trust.controller.ts` | 15 |
| 10 | `POST /v1/reviews` | Buyer | ✅ | `modules/review/review.controller.ts` | 32 |
| 11 | `POST /v1/broadcasts` | User | ✅ | `modules/broadcast/broadcast.controller.ts` | 33 |

---

## Fixes Applied (this session)

1. **Module Registration** — Replaced stub modules (`ListingsModule`, `AuctionsModule`, `OrdersModule`, `GatewayModule`) with real implementations (`ListingModule`, `AuctionModule`, `OrderModule`, `CourierModule`, `TrustModule`, `CommissionModule`, `WalletModule`) in `app.module.ts`
2. **Route Alignment** — Moved controller base paths to `v1` prefix level to match blueprint exact paths:
   - `POST /v1/bids` — added direct endpoint
   - `POST /v1/cod/confirm` — moved from `/v1/orders/cod/confirm`
   - `POST /v1/webhooks/courier` — moved from `/v1/courier/webhooks/courier`
3. **Schema Cleanup** — Removed duplicate User relations and duplicate models (Conversation, Message, Block, KycStatus, MessageType) in Prisma schema
4. **Enum Alignment** — Fixed `ListingCondition` to match blueprint (LIKE_NEW, EXCELLENT, GOOD, FAIR), added admin roles to `UserRole`
5. **Type Check** — All TypeScript errors resolved, both API and frontend compile clean

---

## Additional Endpoints (beyond blueprint)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /v1/auth/refresh` | Public | Refresh JWT token |
| `GET /v1/auth/me` | User | Current user profile |
| `GET /v1/listings/my` | Seller | Seller's own listings |
| `PATCH /v1/listings/:id` | Seller | Update listing |
| `DELETE /v1/listings/:id` | Seller | Soft delete listing |
| `GET /v1/auctions/live` | Optional | Live auctions list |
| `POST /v1/auctions/:listingId/start` | Seller | Start auction |
| `POST /v1/auctions/:listingId/proxy-bid` | Buyer | Set proxy max |
| `GET /v1/orders/my` | Buyer | Buyer's orders |
| `GET /v1/orders/seller` | Seller | Seller's orders |
| `GET /v1/orders/:id` | User | Order detail |
| `GET /v1/user/:id/trust` | Public | Public trust view |
| `GET /v1/reviews/user/:id` | Optional | User's received reviews |
| `GET /v1/reviews/my` | User | User's given reviews |
| `GET /v1/notifications` | User | User's notifications |
| `POST /v1/notifications/:id/read` | User | Mark as read |
| `GET /v1/wallet/balance` | User | Current balance |
| `POST /v1/wallet/withdraw` | User | Request withdrawal |
| `GET /v1/commission/estimate` | User | Commission estimate |
| `POST /v1/subscription/upgrade` | User | Upgrade tier |
| `GET /v1/profile` | User | Current profile |
| `PATCH /v1/profile` | User | Update profile |
| `POST /v1/profile/kyc` | User | Submit KYC |
| `GET /v1/chat/conversations` | User | User's conversations |
| `GET /v1/admin/*` | Admin | Admin dashboard routes |
