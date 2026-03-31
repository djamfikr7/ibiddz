import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, locale: string = 'en'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDZD(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toLocaleString('en-DZ')} دج`;
}

export function formatDate(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function timeAgo(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return locale === 'ar' ? 'الآن' : locale === 'fr' ? "À l'instant" : 'Just now';
  if (diffMins < 60) return `${diffMins}${locale === 'ar' ? ' دقيقة' : locale === 'fr' ? ' min' : 'm'} ${locale === 'ar' ? 'منذ' : 'ago'}`;
  if (diffHours < 24) return `${diffHours}${locale === 'ar' ? ' ساعة' : locale === 'fr' ? 'h' : 'h'} ${locale === 'ar' ? 'منذ' : 'ago'}`;
  return `${diffDays}${locale === 'ar' ? ' يوم' : locale === 'fr' ? 'j' : 'd'} ${locale === 'ar' ? 'منذ' : 'ago'}`;
}

export function getTrustTier(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 88) return { label: 'ELITE', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' };
  if (score >= 75) return { label: 'TRUSTED', color: 'text-success-600', bgColor: 'bg-success-50 border-success-200' };
  if (score >= 60) return { label: 'ACTIVE', color: 'text-primary-600', bgColor: 'bg-primary-50 border-primary-200' };
  return { label: 'NEW', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' };
}

export function getTrustTierLabel(score: number): string {
  if (score >= 88) return 'ELITE';
  if (score >= 75) return 'TRUSTED';
  if (score >= 60) return 'ACTIVE';
  return 'NEW';
}

export function maskIMEI(imei: string): string {
  if (!imei || imei.length < 15) return '•••••••••••••••';
  return `••••••••••${imei.slice(-4)}`;
}

export function calculateCommission(price: number): number {
  const baseFee = Math.max(0.03 * price, 2000);
  const finalCommission = Math.min(baseFee + 500, 8500);
  return Math.round(finalCommission);
}

export function calculateNetPayout(price: number): number {
  return price - calculateCommission(price);
}

export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    NEW: 'New',
    LIKE_NEW: 'Like New',
    EXCELLENT: 'Excellent',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
  };
  return labels[condition] || condition;
}

export function getConditionColor(condition: string): string {
  const colors: Record<string, string> = {
    NEW: 'bg-green-100 text-green-800',
    LIKE_NEW: 'bg-emerald-100 text-emerald-800',
    EXCELLENT: 'bg-blue-100 text-blue-800',
    GOOD: 'bg-yellow-100 text-yellow-800',
    FAIR: 'bg-orange-100 text-orange-800',
    POOR: 'bg-red-100 text-red-800',
  };
  return colors[condition] || 'bg-gray-100 text-gray-800';
}

export function getStorageLabel(storage: number): string {
  if (storage >= 1024) return '1TB';
  return `${storage}GB`;
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^0[567]\d{8}$/.test(cleaned) || /^(\+213|00213)[567]\d{8}$/.test(cleaned);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function generateDeviceFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;
  const components = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 1,
  ];
  return btoa(components.join('|')).replace(/=/g, '');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
