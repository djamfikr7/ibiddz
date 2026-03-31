import { CONDITION_GRADES } from "./constants";
import { ListingCondition } from "./types";

const ALGERIAN_PHONE_REGEX = /^(?:\+213|0)(5|6|7)[0-9]{8}$/;
const IMEI_REGEX = /^[0-9]{15}$/;

export function validateAlgerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return ALGERIAN_PHONE_REGEX.test(cleaned);
}

export function normalizeAlgerianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("0")) {
    return "+213" + cleaned.slice(1);
  }
  if (cleaned.startsWith("+213")) {
    return cleaned;
  }
  return "+213" + cleaned;
}

export function validateIMEI(imei: string): boolean {
  const cleaned = imei.replace(/[\s\-]/g, "");
  if (!IMEI_REGEX.test(cleaned)) {
    return false;
  }
  return luhnCheck(cleaned);
}

function luhnCheck(num: string): boolean {
  let sum = 0;
  let isEven = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export function validateBatteryHealth(health: number): boolean {
  return Number.isInteger(health) && health >= 60 && health <= 100;
}

export function validateConditionGrade(condition: string): condition is ListingCondition {
  return Object.values(ListingCondition).includes(condition as ListingCondition);
}

export function sanitizeText(text: string, maxLength = 5000): string {
  if (!text) return "";
  let sanitized = text.trim();
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  sanitized = sanitized.replace(/[<>]/g, "");
  sanitized = sanitized.replace(/&/g, "&amp;");
  sanitized = sanitized.replace(/"/g, "&quot;");
  sanitized = sanitized.replace(/'/g, "&#x27;");
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function validateWilaya(wilaya: string): boolean {
  const validWilayas = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Bejaia", "Biskra",
    "Bechar", "Blida", "Bouira", "Tamanrasset", "Tebessa", "Tlemcen", "Tiaret",
    "Tizi Ouzou", "Algiers", "Djelfa", "Jijel", "Setif", "Saida", "Skikda",
    "Sidi Bel Abbes", "Annaba", "Guelma", "Constantine", "Medea", "Mostaganem",
    "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj",
    "Boumerdes", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
    "Souk Ahras", "Tipaza", "Mila", "Ain Defla", "Naama", "Ain Temouchent",
    "Ghardaia", "Relizane", "El M'Ghair", "El Meniaa", "Ouled Djellal",
    "Bordj Badji Mokhtar", "Béni Abbès", "Timimoun", "Touggourt", "Djanet",
    "In Salah", "In Guezzam",
  ];
  return validWilayas.includes(wilaya);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  return { valid: errors.length === 0, errors };
}

export function getConditionFromBattery(health: number): ListingCondition {
  if (health >= 95) return ListingCondition.LIKE_NEW;
  if (health >= 85) return ListingCondition.EXCELLENT;
  if (health >= 75) return ListingCondition.GOOD;
  return ListingCondition.FAIR;
}
