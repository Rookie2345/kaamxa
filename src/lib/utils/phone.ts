// Nepali phone validation and helper functions
// Database regex: ^(\+977)?9[78][0-9]{8}$

const NEPALI_PHONE_REGEX = /^(\+977)?[9][78]\d{8}$/;

export function isValidNepaliPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return NEPALI_PHONE_REGEX.test(cleaned);
}

export function cleanNepaliPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  // Normalize to 10 digits or retain +977 prefix
  if (cleaned.startsWith('+977')) {
    return cleaned.slice(4);
  }
  return cleaned;
}

export function formatNepaliPhoneForDisplay(phone: string): string {
  const cleaned = cleanNepaliPhone(phone);
  if (cleaned.length === 10) {
    return `+977 ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function getCallLink(phone: string): string {
  const cleaned = cleanNepaliPhone(phone);
  return `tel:+977${cleaned}`;
}

export function getWhatsAppLink(phone: string, message?: string): string {
  const cleaned = cleanNepaliPhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/977${cleaned}${text}`;
}
