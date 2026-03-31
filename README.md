# iBidDZ - Algerian iPhone Marketplace + Live Auctions

A full-stack platform for buying and selling iPhones in Algeria with live auction capabilities, COD delivery, and trust scoring.

## 🚀 Features

- **Live Auctions** - Real-time bidding with anti-sniping protection
- **COD Delivery** - Cash on delivery with token verification
- **Trust Scoring** - Algorithmic user reputation system
- **Multi-language** - Arabic, French, English with RTL support
- **Admin Dashboard** - Full moderation and financial management
- **Broadcast System** - Push notifications and announcements

## 🏗️ Architecture

```
Auction01/
├── apps/
│   ├── api/          NestJS backend (16 modules)
│   └── web/          Next.js 14 frontend
├── packages/
│   ├── db/           Prisma schema (16 models)
│   ├── shared/       Types, constants, validators
│   └── ui/           Shared components
└── docker-compose.yml
```

## 🛠️ Tech Stack

- **Backend**: NestJS, Prisma, PostgreSQL, Redis, Socket.io, BullMQ
- **Frontend**: Next.js 14, TailwindCSS, next-intl, Socket.io-client
- **Infrastructure**: Docker, GitHub Actions, Turborepo

## 📦 Quick Start

```bash
# Install dependencies
npm install

# Start infrastructure
docker compose up -d postgres redis

# Push database schema
npx prisma db push

# Start development servers
npm run dev
```

## 🔌 API Endpoints

All endpoints follow the blueprint specification:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/otp` | Send SMS verification |
| POST | `/v1/auth/verify` | Validate OTP, issue JWT |
| GET | `/v1/listings` | Filtered browsing |
| POST | `/v1/listings` | Create listing |
| POST | `/v1/bids` | Place bid |
| POST | `/v1/orders` | Create order |
| POST | `/v1/webhooks/courier` | Delivery status sync |
| POST | `/v1/cod/confirm` | Validate token, trigger payout |
| GET | `/v1/user/trust` | View trust score |
| POST | `/v1/reviews` | Submit review |
| POST | `/v1/broadcasts` | Schedule broadcast |

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Type check
npx tsc --noEmit
```

## 📄 License

MIT
