import NepaliDate from 'nepali-date-converter';

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

  try {
    const nepaliDate = new NepaliDate(date);
    const bsFormatted = nepaliDate.format('YYYY MMMM D', 'np');

    const adDay = date.getDate();
    const adMonth = ENGLISH_MONTHS[date.getMonth()];
    const adYear = date.getFullYear();

    return `${bsFormatted} (${adDay} ${adMonth} ${adYear})`;
  } catch {
    // Fallback in case of out of range dates
    return date.toLocaleDateString();
  }
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
