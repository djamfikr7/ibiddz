import {
  TIER_THRESHOLDS,
  CONDITION_GRADES,
  BROADCAST_CREDITS,
  COMMISSION,
} from "./constants";
import type { TrustTier, TrustBreakdown } from "./types";
import { ListingCondition, UserRole } from "./types";

export function formatDZD(amount: number): string {
  const formatted = Math.round(amount).toLocaleString("fr-DZ");
  return `${formatted} DZD`;
}

export function formatTrustScore(score: number): TrustBreakdown {
  let tier: TrustTier = "NEW";
  let badge = "🆕 Nouveau";
  let color = "#9CA3AF";

  if (score >= TIER_THRESHOLDS.ELITE.min) {
    tier = "ELITE";
    badge = "👑 Élite";
    color = "#FFD700";
  } else if (score >= TIER_THRESHOLDS.TRUSTED.min) {
    tier = "TRUSTED";
    badge = "✅ Vérifié";
    color = "#10B981";
  } else if (score >= TIER_THRESHOLDS.ACTIVE.min) {
    tier = "ACTIVE";
    badge = "🟢 Actif";
    color = "#3B82F6";
  }

  let nextTierScore: number = TIER_THRESHOLDS.ACTIVE.min;
  let nextTierName = "Active";
  if (score < TIER_THRESHOLDS.ELITE.min && score >= TIER_THRESHOLDS.TRUSTED.min) {
    nextTierScore = TIER_THRESHOLDS.ELITE.min;
    nextTierName = "Élite";
  } else if (score < TIER_THRESHOLDS.TRUSTED.min && score >= TIER_THRESHOLDS.ACTIVE.min) {
    nextTierScore = TIER_THRESHOLDS.TRUSTED.min;
    nextTierName = "Vérifié";
  } else if (score < TIER_THRESHOLDS.ACTIVE.min) {
    nextTierScore = TIER_THRESHOLDS.ACTIVE.min;
    nextTierName = "Actif";
  } else {
    nextTierScore = 1000;
    nextTierName = "Max";
  }

  return {
    score,
    tier,
    badge,
    color,
    completedSales: 0,
    ratings: 0,
    accountAgeDays: 0,
    verified: false,
    disputeRate: 0,
    nextTierScore,
    nextTierName,
  };
}

export function formatCondition(
  condition: string
): { label: string; labelAR: string; labelFR: string } {
  const labels: Record<string, { label: string; labelAR: string; labelFR: string }> = {
    LIKE_NEW: {
      label: "Like New",
      labelAR: "كالجديد",
      labelFR: "Comme neuf",
    },
    EXCELLENT: {
      label: "Excellent",
      labelAR: "ممتاز",
      labelFR: "Excellent",
    },
    GOOD: {
      label: "Good",
      labelAR: "جيد",
      labelFR: "Bon",
    },
    FAIR: {
      label: "Fair",
      labelAR: "مقبول",
      labelFR: "Correct",
    },
  };
  return (
    labels[condition] || {
      label: "Unknown",
      labelAR: "غير معروف",
      labelFR: "Inconnu",
    }
  );
}

export function maskIMEI(imei: string): string {
  if (imei.length < 8) return imei;
  const visible = imei.slice(-4);
  const masked = imei.slice(0, 8).replace(/[0-9]/g, "*");
  return `${masked}${visible}`;
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}j ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function getCommissionForRole(role: UserRole, amount: number): number {
  let rate: number;
  switch (role) {
    case UserRole.ELITE:
      rate = COMMISSION.ELITE_RATE;
      break;
    case UserRole.CERTIFIE:
      rate = COMMISSION.CERTIFIE_RATE;
      break;
    case UserRole.PRO:
      rate = COMMISSION.PRO_RATE;
      break;
    default:
      rate = COMMISSION.BASIC_RATE;
  }

  const commission = Math.round(amount * rate);
  return Math.max(COMMISSION.MIN_FEE, Math.min(COMMISSION.MAX_FEE, commission));
}

export function getBroadcastPriceForRole(role: UserRole): number {
  const tier = role as keyof typeof BROADCAST_CREDITS;
  return BROADCAST_CREDITS[tier]?.price ?? BROADCAST_CREDITS.BASICO.price;
}

export function getMaxBroadcastsPerDay(role: UserRole): number {
  const tier = role as keyof typeof BROADCAST_CREDITS;
  return BROADCAST_CREDITS[tier]?.maxPerDay ?? BROADCAST_CREDITS.BASICO.maxPerDay;
}

export function getWithdrawalFee(amount: number): number {
  const fee = Math.round(amount * WITHDRAWAL_FEE_PERCENT);
  return Math.max(WITHDRAWAL_FEE_MIN, Math.min(WITHDRAWAL_FEE_MAX, fee));
}

const WITHDRAWAL_FEE_PERCENT = 0.01;
const WITHDRAWAL_FEE_MIN = 50;
const WITHDRAWAL_FEE_MAX = 2000;

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHr < 24) return `il y a ${diffHr}h`;
  if (diffDay < 7) return `il y a ${diffDay}j`;
  return date.toLocaleDateString("fr-DZ");
}

export function formatStorageLabel(storage: number): string {
  if (storage >= 1000) {
    return `${storage / 1000} To`;
  }
  return `${storage} Go`;
}
