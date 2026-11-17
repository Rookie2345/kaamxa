// Nepali Bikram Sambat (BS) and AD dual date utility

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toDevanagariNumerals(num: number | string): string {
  return num
    .toString()
    .split('')
    .map((char) => {
      const n = parseInt(char, 10);
      return !isNaN(n) ? DEVANAGARI_DIGITS[n] : char;
    })
    .join('');
}

const NEPALI_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फागुन', 'चैत'
];

const ENGLISH_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns formatted dual date string: e.g., "२०८३ मंसिर १ (17 Nov 2026)"
 */
export function formatDualDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const adYear = date.getFullYear();
  const adMonthIndex = date.getMonth();
  const adDay = date.getDate();

  // BS is approximately 56 years and 8 months ahead.
  // Approx: mid-April is Baisakh 1
  let bsYear = adYear + 57;
  let bsMonthIndex = (adMonthIndex + 8) % 12;
  if (adMonthIndex < 3 || (adMonthIndex === 3 && adDay < 14)) {
    bsYear = adYear + 56;
  }

  const bsMonthName = NEPALI_MONTHS[bsMonthIndex];
  const bsDay = toDevanagariNumerals(adDay);
  const bsYearStr = toDevanagariNumerals(bsYear);

  const adFormatted = `${adDay} ${ENGLISH_MONTHS[adMonthIndex]} ${adYear}`;

  return `${bsYearStr} ${bsMonthName} ${bsDay} (${adFormatted})`;
}

/**
 * Short relative time in Nepali and English
 */
export function formatRelativeTime(dateInput: string | Date, lang: 'ne' | 'en' = 'ne'): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return lang === 'ne' ? 'भर्खरै' : 'just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return lang === 'ne' 
      ? `${toDevanagariNumerals(diffInMinutes)} मिनेट अघि` 
      : `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return lang === 'ne' 
      ? `${toDevanagariNumerals(diffInHours)} घण्टा अघि` 
      : `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  return lang === 'ne' 
    ? `${toDevanagariNumerals(diffInDays)} दिन अघि` 
    : `${diffInDays}d ago`;
}
