# 📑 iBidDZ – Master Platform Blueprint
**Second-Hand iPhone Marketplace + Live Auctions | P2P COD | Algeria-Optimized**

---

## 📘 Executive Summary

**iBidDZ** is a hybrid e-commerce and real-time auction platform specializing in pre-owned iPhones for the Algerian market. It replaces fragmented Facebook groups and informal souks with a structured, trust-first ecosystem featuring:
- Fixed-price & live auction listings
- P2P Cash-on-Delivery (COD) as primary settlement
- Dynamic commission + subscription + PAYG monetization
- Behavioral trust scoring, automated moderation, and tiered broadcasting
- Full Arabic/French/English localization, Algerian logistics integration, and regulatory compliance

This document serves as the complete technical, operational, and commercial blueprint for MVP through Scale.

---

## 1. 🏗️ Platform Architecture & Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | `Next.js 14` (App Router) + `TailwindCSS` + `next-intl` | SSR/SEO, mobile-first, RTL/FR/EN i18n |
| **Backend** | `Node.js` + `NestJS` (modular) + `tRPC`/REST gateway | Strict typing, real-time ready, scalable microservices |
| **Database** | `PostgreSQL 15` + `Prisma ORM` + `PgBouncer` | ACID compliance, relational integrity, connection pooling |
| **Cache/Queue** | `Redis` + `BullMQ` | Session store, rate limiting, async jobs (payouts, broadcasts) |
| **Real-time** | `Socket.io` + `Redis Adapter` | Bid sync, countdowns, live notifications, anti-sniping |
| **Storage** | `Cloudinary` or `Supabase Storage` | Auto-watermark, image optimization, CDN delivery |
| **Auth** | `JWT` + `SMS OTP` (Twilio/Infobip or local DZ aggregator) | Phone-first, CNIE verification, device binding |
| **Monitoring** | `Sentry` + `Prometheus/Grafana` + `ELK` | Error tracking, APM, log aggregation, uptime SLA |
| **Deployment** | `Vercel` (FE) + `Render/DigitalOcean` (BE/DB) + `Cloudflare WAF` | Low-latency DZ routing, automatic scaling, DDoS protection |

### 🔌 API & Integration Pattern
- **API Gateway**: Rate-limited, versioned (`/v1/`), JWT + role middleware
- **Webhook Receivers**: Courier delivery status, SMS delivery receipts, payment confirmations
- **Event Bus**: `NATS` or `Redis Pub/Sub` for decoupled triggers (bid → notification → trust update)

---

## 2. 🛍️ Core Features & User Journeys

### 👤 Buyer Flow
1. Browse → Filter by model, storage, condition, battery health, price range, location
2. View listing → IMEI mask, photo carousel, seller trust badge, warranty options
3. Place bid / Buy Now → Confirm COD → Generate `codToken`
4. Track delivery → Inspect → Verify token → Rate & Review
5. Join auction → Set proxy max → Receive anti-sniping extensions → Win/Lose notification

### 📦 Seller Flow
1. KYC → Phone OTP + CNIE/Passport upload → Address validation
2. List device → Upload photos (auto-watermark) → Select condition grade → Set price/reserve
3. AI pricing suggestion → Review estimated commission & net payout
4. Print shipping label / self-delivery → Hand to courier → Await `DELIVERED` webhook
5. Wallet credited → Withdraw to CCP/EDAHABIA/Bank → Reinvest or cash out

### 📊 Condition Grading Standard
| Grade | Battery Health | Cosmetic | Functional | Warranty Eligible |
|-------|----------------|----------|------------|-------------------|
| `LIKE_NEW` | $≥90\%$ | Flawless | $100\%$ | Yes ($3$–$6$ mo) |
| `EXCELLENT` | $80\%$–$89\%$ | Micro-scratches | $100\%$ | Yes ($3$ mo) |
| `GOOD` | $75\%$–$79\%$ | Visible wear | Fully functional | Optional |
| `FAIR` | $<75\%$ | Dents/scratches | Minor issues | No |

> All grades require photo evidence of screen, back, ports, and battery health screenshot.

---

## 3. 💰 Business Model & Monetization

### 📐 Commission Architecture
Every successful settlement incurs a transparent fee:
$$ \text{Base Fee} = \max\left(0.03 \times P, \; 2{,}000 \text{ DZD}\right) $$
$$ \text{Final Commission} = \min\left(\text{Base Fee} \times (1 - M_{\text{tier}}) + \Delta_{\text{auction}}, \; 8{,}500 \text{ DZD}\right) $$

| Variable | Value | Note |
|----------|-------|------|
| $P$ | Final settlement price (DZD) | Fixed or auction win |
| $M_{\text{tier}}$ | $0$ (Basic), $0.015$ (PRO), $0.020$ (Certified) | Role-based discount |
| $\Delta_{\text{auction}}$ | $+500 \text{ DZD}$ | Real-time infra surcharge |
| Cap | $8{,}500 \text{ DZD}$ | Prevents excessive fees on high-value devices |

### 🎫 Subscription & PAYG Hybrid
| Tier | Monthly Fee | Commission Discount | Free Broadcasts | PAYG Credit Price |
|------|-------------|---------------------|-----------------|-------------------|
| `BASICO` | $0$ | $0\%$ | $0$ | N/A |
| `PRO` | $2{,}900 \text{ DZD}$ | $1.5\%$ | $3$ | $120 \text{ DZD}$ |
| `CERTIFIÉ` | $7{,}900 \text{ DZD}$ | $2.0\%$ | $10$ | $90 \text{ DZD}$ |
| `ELITE` (Trust $≥88$) | Invite/Unlock | $2.5\%$ | $20$ + scheduling | $70 \text{ DZD}$ |

**PAYG Logic**: Users purchase `Broadcast Credits` or `Listing Boosts`. Trust score discounts credit cost dynamically:
$$ \text{CreditCost} = 150 \times \left(1 - 0.005 \cdot \max(0, T - 60)\right) $$

### 💸 Payout & Settlement
- Commission deducted at `DELIVERED` webhook confirmation
- $10\%$ dispute reserve held for $7$ days
- Withdrawal fee: $1\%$ if balance $<50{,}000 \text{ DZD}$, else $0\%$
- Processing: $24$h to CCP/EDAHABIA/Bank via partner APIs or manual batch

---

## 4. 🛡️ Trust, Reputation & Moderation

### 📈 Trust Score Formula
$$ T = \min\left(100, \max\left(0, \; 0.35R + 0.25C - 0.20D + 0.10V + 0.10A \right) \right) $$

| Component | Calculation | Range |
|-----------|-------------|-------|
| $R$ | Review rating normalized to $0$–$100$ | $0$–$100$ |
| $C$ | Successful COD completions / total attempts | $0$–$100$ |
| $D$ | Disputes $\times 15$ | $0$+ |
| $V$ | Verification bonus ($0$, $10$, $20$) | Fixed |
| $A$ | Account age & consistency factor | $0$–$20$ |

### 🏅 Trust Tiers & Privileges
| Range | Badge | Benefits |
|-------|-------|----------|
| $0$–$59$ | `NEW` | Manual review, $7$-day hold |
| $60$–$74$ | `ACTIVE` | Auto-publish, standard disputes |
| $75$–$87$ | `TRUSTED` | Priority placement, $3$-day hold |
| $88$–$100$ | `ELITE` | Instant payout, zero reserve, broadcast discounts |

### 🚫 Banning & Blacklisting
- **3-Strike Policy**: Warning ($3$d) → Suspension ($30$d) → Permanent Ban
- **Evasion Detection**: `SHA256(phone+salt)`, device fingerprint, IP subnet velocity
- **Appeal Workflow**: $7$-day window → evidence upload → manual tribunal → $72$h decision
- **Anti-Collusion**: Bipartite rating graph analysis blocks circular $5$-star swaps

### 🤖 Moderation Pipeline
1. `pHash` image duplicate detection
2. NLP flags: `contrefaçon`, `clone`, `débloqué illégal`, spam patterns
3. Low-trust posts → manual queue
4. Automated mute if bounce/unsubscribe $>15\%$

---

## 5. 📢 Broadcasting & Engagement Engine

| Channel | Audience | Delivery | Moderation |
|---------|----------|----------|------------|
| `ADMIN_ANNOUNCE` | All | Banner + SMS (critical) | Manual |
| `SELLER_POST` | Followers + watchers | Feed + push + WhatsApp | AI + queue if $T<75$ |
| `BUYER_ALERT` | Wishlist matchers | Push + in-app | Automated |
| `AUCTION_LIVE` | Registered bidders | Socket + SMS ($5$ min) | System |

**Anti-Spam**: Max $5$/day ($T<88$), $4$h cooldown, duplicate hash blocking, mandatory opt-out footer.

**Analytics per Broadcast**: Impressions → Clicks → Cart Adds → Orders → ROI per credit.

---

## 6. 🚚 Logistics, COD & Reconciliation

### 📦 Courier Integration
- Partner: `Yalidine Express`, `ZR Express`, `Eco Shipping`, local riders
- API sync: `CREATED` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`/`FAILED`
- Label generation, routing optimization, SLA tracking

### 💵 COD Verification Flow
1. Buyer receives `codToken` (6-char alphanumeric)
2. Courier requests token on arrival
3. Buyer inspects → confirms in app or verbally
4. Courier marks `DELIVERED` → webhook triggers settlement
5. Platform deducts commission → credits seller wallet → initiates payout

### 🔄 Failed Delivery & Returns
- $3$ attempts max → auto-return to seller
- Return fee deducted from seller wallet ($800$–$1{,}200 \text{ DZD}$)
- Relist option or dispute escalation if mismatch claimed

### 📊 Cash Reconciliation
- Daily settlement report: Orders, commissions, courier fees, net payouts
- Reconciliation tool matches courier COD deposits to platform ledger
- Discrepancy flagging → manual audit ticket

---

## 7. 🎧 Support, Dispute Resolution & Customer Success

### 🛠️ Ticketing & Live Support
- Multilingual help center (AR/FR/EN) with searchable KB
- In-app chat → WhatsApp fallback (dominant in DZ)
- SLA tiers: `BASICO` ($48$h), `PRO` ($24$h), `CERTIFIÉ` ($12$h), `ELITE` ($6$h)

### ⚖️ Dispute Workflow
1. Buyer flags mismatch within $48$h of delivery
2. Evidence upload: photos, chat logs, IMEI mismatch proof
3. Platform escrow hold → mediation ($3$–$5$ days)
4. Resolution: Partial refund, full return/relist, or case closed
5. Trust score adjustment + seller strike if verified fault

### 📞 Proactive Success
- Automated check-in $24$h post-delivery
- Battery/IMEI verification reminders
- Seasonal "Trust Boost" campaigns for on-time ratings

---

## 8. 🔒 Security, Compliance & Algerian Adaptation

| Area | Implementation |
|------|----------------|
| **Data Encryption** | AES-256 at rest (`phone`, `codToken`, CNIE), TLS 1.3 in transit |
| **Algerian Law** | Registered as `Service de Mise en Relation`, ARPT SMS compliance, consumer disclosure (`CGV`, `Politique de Retour`) |
| **Retention** | Ban logs $12$ months, transaction records $24$ months, minimal PII collection |
| **Rate Limiting** | `express-rate-limit`: $100$ req/min per IP, $10$ bids/min per user |
| **WAF/DDoS** | Cloudflare Ruleset, bot challenge on `/api/bid`, geo-block non-DZ if needed |
| **Backup/DR** | Daily PG snapshots, Redis dump, object storage versioning, $99.9\%$ SLA target |

---

## 9. 🖥️ Admin & Operations Dashboard

- **RBAC**: `SuperAdmin`, `Moderator`, `Finance`, `Support`, `CourierLiaison`
- **Modules**:
  - User management (trust override, manual ban, KYC verification)
  - Listing moderation queue (image/text review, condition approval)
  - Financial reporting (GMV, take rate, commission ledger, payout batch)
  - Broadcast analytics (delivery rate, CTR, credit consumption)
  - System health (API latency, error rate, queue depth, DB load)
- **Export**: CSV/PDF invoices, audit logs, courier reconciliation sheets
- **Audit Trail**: Immutable log of admin actions, ban appeals, payout overrides

---

## 10. 🚀 Deployment, CI/CD & Monitoring

```yaml
# ci-cd-pipeline.yml (GitHub Actions example)
name: Deploy iBidDZ
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint && npm run test:unit
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: vercel --prod --token $VERCEL_TOKEN
      - run: docker build -f Dockerfile . -t registry.example.com/ibiddz-be
      - run: kubectl rollout status -n prod deploy/ibiddz-backend
```

- **Staging → Prod**: Feature flags (`LaunchDarkly` or custom), canary releases
- **Monitoring**: `Sentry` (FE/BE errors), `Prometheus` (metrics), `Grafana` (dashboards)
- **Alerting**: Slack/PagerDuty on $>95^{th}$ percentile latency, $>1\%$ error rate, failed courier webhooks

---

## 11. 📈 Go-to-Market & Growth Strategy

| Phase | Action | Target Metric |
|-------|--------|---------------|
| **Pre-Launch** | Onboard $20$ certified refurbishers, beta test with $200$ users | $50$ active listings, $<5\%$ defect rate |
| **Launch (Algiers/Oran)** | Facebook/WhatsApp ads, referral credits ($500 \text{ DZD}$), influencer demo | $1{,}000$ MAU, $85\%$ COD completion |
| **Scale (Months 3–6)** | Activate subscriptions, broadcast credits, warranty upsells | $3\%$ effective take rate, $NPS > 45$ |
| **National (Months 6–12)** | Courier API expansion, Arabic SEO, B2B wholesale channel | $10{,}000$ MAU, $<2\%$ dispute ratio |

**Retention Loops**:
- Trust score progression → lower fees → more listings
- Broadcast ROI dashboard → reinvest credits
- Referral trust: Both parties gain $+3T$ after $2$ successful CODs

---

## 12. 🗺️ Implementation Roadmap & KPIs

| Quarter | Milestone | KPI Targets |
|---------|-----------|-------------|
| **Q1** | MVP: Fixed listings, basic COD, trust scoring core, SMS OTP | $500$ transactions, $90\%$ COD success |
| **Q2** | Live auctions, anti-sniping, PAYG credits, courier API sync | $3\%$ take rate, $<3\%$ disputes |
| **Q3** | Subscriptions, broadcast scheduling, warranty add-ons, admin RBAC | $1{,}500$ MAU, $NPS 40+$ |
| **Q4** | AI pricing, referral trust, B2B channel, national logistics | $5{,}000$ MAU, $95\%$ SLA uptime |

---

<details>
<summary>📎 Appendix A – Extended Prisma Schema</summary>

```prisma
model User {
  id            String   @id @default(cuid())
  phone         String   @unique
  trustScore    Float    @default(50)
  strikeCount   Int      @default(0)
  banStatus     String   @default("ACTIVE")
  walletDZD     Float    @default(0)
  role          String   @default("BASICO") // BASICO, PRO, CERTIFIE
  listings      Listing[]
  bids          Bid[]
  orders        Order[]
  reviewsGiven  Review[] @relation("Reviewer")
  reviewsReceived Review[] @relation("Target")
  broadcasts    Broadcast[]
  followers     Follow[] @relation("Followers")
  following     Follow[] @relation("Following")
  createdAt     DateTime @default(now())
}

model Listing {
  id            String   @id @default(cuid())
  sellerId      String
  title         String
  condition     String   // LIKE_NEW, EXCELLENT, GOOD, FAIR
  batteryHealth Int
  imeiHash      String
  priceDZD      Float?
  auction       Boolean  @default(false)
  startPrice    Float?
  reservePrice  Float?
  endTime       DateTime?
  status        String   @default("ACTIVE")
  photos        String[] // Cloudinary URLs
  seller        User     @relation(fields: [sellerId], references: [id])
  bids          Bid[]
  order         Order?
}

model Bid {
  id        String   @id @default(cuid())
  listingId String
  userId    String
  amountDZD Float
  placedAt  DateTime @default(now())
  listing   Listing  @relation(fields: [listingId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

model Order {
  id          String @id @default(cuid())
  listingId   String @unique
  buyerId     String
  codAmount   Float
  codToken    String @unique
  status      String @default("PENDING")
  courierRef  String?
  settledAt   DateTime?
  listing     Listing @relation(fields: [listingId], references: [id])
  buyer       User    @relation(fields: [buyerId], references: [id])
}

model Review {
  id        String   @id @default(cuid())
  reviewerId String
  targetId  String
  orderId   String
  rating    Int
  tags      String[]
  comment   String?
  createdAt DateTime @default(now())
  reviewer  User     @relation("Reviewer", fields: [reviewerId], references: [id])
  target    User     @relation("Target", fields: [targetId], references: [id])
}

model Broadcast {
  id          String   @id @default(cuid())
  senderId    String
  channel     String
  audience    String[]
  content     String
  mediaUrl    String?
  creditCost  Float
  status      String   @default("QUEUED")
  sentAt      DateTime?
  sender      User     @relation(fields: [senderId], references: [id])
}

model Follow {
  followerId String
  followingId String
  notified   Boolean @default(true)
  @@id([followerId, followingId])
}
```
</details>

<details>
<summary>📎 Appendix B – Core API Endpoints</summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/v1/auth/otp` | Public | Send SMS verification |
| `POST` | `/v1/auth/verify` | Public | Validate OTP, issue JWT |
| `GET`  | `/v1/listings` | Optional | Filtered browsing |
| `POST` | `/v1/listings` | Seller | Create listing (KYC check) |
| `POST` | `/v1/bids` | Buyer | Place bid (anti-sniping logic) |
| `POST` | `/v1/orders` | Buyer | Confirm COD, generate token |
| `POST` | `/v1/webhooks/courier` | System | Delivery status sync |
| `POST` | `/v1/cod/confirm` | Courier/Buyer | Validate token, trigger payout |
| `GET`  | `/v1/user/trust` | User | View score breakdown |
| `POST` | `/v1/reviews` | Buyer | Submit post-delivery rating |
| `POST` | `/v1/broadcasts` | User | Schedule push/feed message |
</details>

<details>
<summary>📎 Appendix C – Algerian Compliance Checklist</summary>

- [ ] Commercial registry as electronic matchmaking service
- [ ] `Mentions Légales`, `CGV`, `Politique de Retour` in AR/FR
- [ ] SMS opt-in compliance (ARPT guidelines)
- [ ] Data retention: $12$ months logs, $24$ months transactions
- [ ] Clear disclaimer for `used/Ikhtilaf` items
- [ ] Digital receipt generation for commissions
- [ ] CNIE scan encryption, minimal PII storage
- [ ] Dispute mediation aligned with Algerian consumer protection norms
</details>

---

## ✅ Final Advisory

1. **Start lean**: MVP with fixed COD, manual trust scoring, and $3\%$ flat fee. Validate unit economics before activating auctions/subscriptions.
2. **Trust > Features**: In COD markets, delivery reliability and dispute fairness drive retention faster than UI polish.
3. **Localize deeply**: Arabic/French parity, WhatsApp fallback, CCP/EDAHABIA routing, and Yalidine/ZR sync are non-negotiable.
4. **Monitor take-rate health**: Target $2.5\%$–$3.5\%$ effective rate. Adjust $M_{\text{tier}}$ and credit pricing if churn $>8\%/month$.
5. **Phase broadcasting**: Open gradually. Gate behind $T \geq 60$ to prevent spam, then scale with PAYG credits.

Would you like this exported as a printable PDF/Notion workspace, a ready-to-clone GitHub repository structure, or a detailed financial model spreadsheet (GMV, take rate, CAC, LTV projections) next?