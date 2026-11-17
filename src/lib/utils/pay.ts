import { toDevanagariNumerals } from './date';
import type { PayType } from '@/types/database.types';

export function formatNumberWithCommas(num: number | string, lang: 'ne' | 'en' = 'ne'): string {
  const parts = Number(num).toLocaleString('en-IN');
  return lang === 'ne' ? toDevanagariNumerals(parts) : parts;
}

export function formatPay(
  payType: PayType,
  payMin: number | null,
  payMax: number | null,
  negotiable: boolean = false,
  lang: 'ne' | 'en' = 'ne'
): string {
  const currency = lang === 'ne' ? 'रु.' : 'Rs.';
  const payTypeLabelMap: Record<PayType, { ne: string; en: string }> = {
    hour: { ne: 'घण्टा', en: 'hr' },
    day: { ne: 'दिन', en: 'day' },
    month: { ne: 'महिना', en: 'month' },
    job: { ne: 'काम', en: 'job' },
  };

  const unit = payTypeLabelMap[payType] ? payTypeLabelMap[payType][lang] : payType;

  // Case 1: No numbers given, negotiable only
  if (!payMin && !payMax) {
    return lang === 'ne' ? 'सहमतिमा' : 'Negotiable';
  }

  let amountStr = '';
  if (payMin !== null && payMax !== null) {
    if (payMin === payMax) {
      amountStr = `${currency} ${formatNumberWithCommas(payMin, lang)}`;
    } else {
      amountStr = `${currency} ${formatNumberWithCommas(payMin, lang)} - ${formatNumberWithCommas(payMax, lang)}`;
    }
  } else if (payMin !== null) {
    amountStr = `${currency} ${formatNumberWithCommas(payMin, lang)}+`;
  } else if (payMax !== null) {
    amountStr = `Up to ${currency} ${formatNumberWithCommas(payMax, lang)}`;
  }

  const result = `${amountStr} / ${unit}`;

  if (negotiable) {
    const negLabel = lang === 'ne' ? '(सहमतिमा)' : '(Neg.)';
    return `${result} ${negLabel}`;
  }

  return result;
}
