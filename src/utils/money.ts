import type { Minor } from '@/types';

/**
 * Para yardımcıları.
 *
 * Kural: tüm tutarlar tam sayı KURUŞ olarak tutulur (1 TL = 100 kuruş).
 * Böylece 0.1 + 0.2 gibi kayan noktalı toplama hataları oluşmaz.
 * Biçimlendirme ve ayrıştırma yalnızca burada yapılır.
 */

export const MINOR_PER_UNIT = 100;

const CURRENCY_SYMBOLS: Readonly<Record<string, string>> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};

/** Binlik ayraçları nokta ile gruplar (Türkçe biçim). */
function groupIntegerDigits(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : value.toString();
}

/**
 * Kullanıcının serbest metin olarak girdiği tutarı kuruşa çevirir.
 *
 * Hem Türkçe ondalık virgül ("12,50") hem de nokta ("12.50") desteklenir.
 * Binlik ayraçları da tolere edilir ("1.234,56" / "1,234.56").
 *
 * @returns Geçerli pozitif/sıfır tutar için kuruş; aksi halde null.
 */
export function parseAmountToMinor(raw: string): Minor | null {
  if (typeof raw !== 'string') return null;

  // Boşluk, para birimi ve görünmez ayraçları temizle.
  const cleaned = raw.replace(/[₺$€\s\u00a0\u202f]/g, '').trim();
  if (cleaned === '') return null;

  // Negatif ve geçersiz karakterleri reddet (gider yönü `type` ile belirlenir).
  if (cleaned.includes('-') || !/^[0-9.,]+$/.test(cleaned)) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  let normalized: string;

  if (lastComma !== -1 && lastDot !== -1) {
    // İkisi de varsa: sondaki ondalık, diğeri binlik ayracıdır.
    const decimalSep = lastComma > lastDot ? ',' : '.';
    const thousandSep = decimalSep === ',' ? '.' : ',';
    normalized = cleaned.split(thousandSep).join('');
    normalized = normalized.replace(decimalSep, '.');
  } else if (lastComma !== -1) {
    const digitsAfter = cleaned.length - lastComma - 1;
    normalized =
      digitsAfter === 1 || digitsAfter === 2
        ? cleaned.replace(',', '.')
        : cleaned.split(',').join('');
  } else if (lastDot !== -1) {
    const digitsAfter = cleaned.length - lastDot - 1;
    const count = (cleaned.match(/\./g) ?? []).length;
    normalized =
      count === 1 && (digitsAfter === 1 || digitsAfter === 2)
        ? cleaned
        : cleaned.split('.').join('');
  } else {
    normalized = cleaned;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;

  // Yuvarlama: kayan noktalı çarpımın yarattığı sapmayı düzelt.
  return Math.round(value * MINOR_PER_UNIT);
}

/** Kuruş değerini "1.234,56" biçiminde (sembolsüz) metne çevirir. */
export function formatMinorPlain(minor: Minor): string {
  const safe = Number.isFinite(minor) ? Math.round(minor) : 0;
  const sign = safe < 0 ? '-' : '';
  const abs = Math.abs(safe);
  const units = Math.floor(abs / MINOR_PER_UNIT);
  const cents = abs % MINOR_PER_UNIT;
  return `${sign}${groupIntegerDigits(units)},${pad2(cents)}`;
}

/**
 * Kuruş değerini yerelleştirilmiş para metnine çevirir.
 * Intl mevcutsa onu kullanır; aksi halde Türkçe biçime düşer.
 */
export function formatMinor(minor: Minor, currency = 'TRY'): string {
  const safe = Number.isFinite(minor) ? minor : 0;
  const locale = currency === 'TRY' ? 'tr-TR' : currency === 'EUR' ? 'de-DE' : 'en-US';

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(safe / MINOR_PER_UNIT);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
    const body = formatMinorPlain(safe);
    const negative = safe < 0;
    const unsigned = negative ? body.slice(1) : body;
    return negative ? `-${symbol}${unsigned}` : `${symbol}${unsigned}`;
  }
}

/** Grafik eksenleri için kısa biçim: ₺1,2B / ₺3,4Mn gibi. */
export function formatMinorCompact(minor: Minor): string {
  const safe = Number.isFinite(minor) ? minor : 0;
  const units = safe / MINOR_PER_UNIT;
  const abs = Math.abs(units);

  if (abs >= 1_000_000_000) return `₺${(units / 1_000_000_000).toFixed(1).replace('.', ',')}Mr`;
  if (abs >= 1_000_000) return `₺${(units / 1_000_000).toFixed(1).replace('.', ',')}Mn`;
  if (abs >= 1_000) return `₺${(units / 1_000).toFixed(1).replace('.', ',')}B`;
  return `₺${units.toFixed(0)}`;
}

/**
 * Kuruş dizisini tam sayı hassasiyetiyle toplar.
 * NaN / Infinity değerler yok sayılarak güvenli toplam döner.
 */
export function sumMinor(values: readonly Minor[]): Minor {
  return values.reduce<Minor>((total, value) => {
    if (!Number.isFinite(value)) return total;
    return total + Math.round(value);
  }, 0);
}

/** Kuruş değerini 0..1 aralığına sıkıştırılmış orana çevirir. */
export function ratio(part: Minor, whole: Minor): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0;
  return Math.max(0, Math.min(1, part / whole));
}
