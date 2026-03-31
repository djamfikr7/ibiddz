export const COMMISSION = {
  BASIC_RATE: 0.05,
  PRO_RATE: 0.04,
  CERTIFIE_RATE: 0.03,
  ELITE_RATE: 0.02,
  MIN_FEE: 100,
  MAX_FEE: 5000,
} as const;

export const TIER_DISCOUNTS = {
  BASICO: 0,
  PRO: 0.1,
  CERTIFIE: 0.2,
  ELITE: 0.3,
} as const;

export const AUCTION_SURCHARGE = 0.02;

export const TRUST_SCORE_WEIGHTS = {
  COMPLETED_SALES: 0.3,
  RATINGS: 0.25,
  ACCOUNT_AGE: 0.15,
  VERIFIED_ID: 0.15,
  DISPUTE_RATE: 0.15,
} as const;

export const TIER_THRESHOLDS = {
  NEW: { min: 0, max: 199 },
  ACTIVE: { min: 200, max: 499 },
  TRUSTED: { min: 500, max: 799 },
  ELITE: { min: 800, max: 1000 },
} as const;

export const CONDITION_GRADES = {
  LIKE_NEW: {
    label: "Like New",
    minBattery: 95,
    maxBattery: 100,
    description: "No visible signs of use, battery health 95-100%",
  },
  EXCELLENT: {
    label: "Excellent",
    minBattery: 85,
    maxBattery: 94,
    description: "Minimal wear, battery health 85-94%",
  },
  GOOD: {
    label: "Good",
    minBattery: 75,
    maxBattery: 84,
    description: "Light wear, fully functional, battery health 75-84%",
  },
  FAIR: {
    label: "Fair",
    minBattery: 60,
    maxBattery: 74,
    description: "Visible wear, fully functional, battery health 60-74%",
  },
} as const;

export const COD = {
  TOKEN_LENGTH: 6,
  OTP_EXPIRY_SECONDS: 300,
  OTP_MAX_ATTEMPTS: 3,
  OTP_LOCKOUT_MINUTES: 15,
} as const;

export const RATE_LIMITS = {
  GLOBAL: {
    WINDOW_MS: 60_000,
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 60_000,
    MAX_REQUESTS: 10,
  },
  LISTING_CREATE: {
    WINDOW_MS: 3_600_000,
    MAX_REQUESTS: 20,
  },
  MESSAGE_SEND: {
    WINDOW_MS: 60_000,
    MAX_REQUESTS: 30,
  },
  BID_PLACE: {
    WINDOW_MS: 60_000,
    MAX_REQUESTS: 50,
  },
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_CURSOR: "",
} as const;

export const COURIER = {
  RETURN_FEE: 500,
  STANDARD_DELIVERY: 400,
  EXPRESS_DELIVERY: 800,
  WILAYA_SURCHARGE: 200,
} as const;

export const WITHDRAWAL = {
  MIN_AMOUNT: 1000,
  MAX_AMOUNT: 500000,
  FEE_PERCENT: 0.01,
  FEE_MIN: 50,
  FEE_MAX: 2000,
  DAILY_LIMIT: 1000000,
} as const;

export const BROADCAST_CREDITS = {
  BASICO: { price: 100, maxPerDay: 2 },
  PRO: { price: 75, maxPerDay: 5 },
  CERTIFIE: { price: 50, maxPerDay: 10 },
  ELITE: { price: 25, maxPerDay: 20 },
} as const;

export const APP_CONSTANTS = {
  APP_NAME: "iBidDZ",
  APP_TAGLINE: "Algerian iPhone Marketplace",
  CURRENCY: "DZD",
  LOCALE: "ar-DZ",
  SUPPORT_EMAIL: "support@ibiddz.com",
  SUPPORT_PHONE: "+213555000000",
  TERMS_URL: "https://ibiddz.com/terms",
  PRIVACY_URL: "https://ibiddz.com/privacy",
} as const;

export const IMAGE_LIMITS = {
  MAX_LISTING_PHOTOS: 10,
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  THUMBNAIL_WIDTH: 400,
  THUMBNAIL_HEIGHT: 400,
} as const;

export const AUCTION_CONSTANTS = {
  MIN_STARTING_BID: 1000,
  MIN_BID_INCREMENT: 500,
  MIN_DURATION_SECONDS: 3600,
  MAX_DURATION_SECONDS: 604800,
  EXTENSION_SECONDS: 120,
  COUNTDOWN_WARNING_SECONDS: 300,
} as const;
