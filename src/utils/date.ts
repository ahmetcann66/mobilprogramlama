import { ExtendedPeriodPreset, PeriodPreset } from '@/types';
import type { DateKey, DateRange, PeriodPreset as PeriodPresetType } from '@/types';

/**
 * Tarih yardımcıları.
 *
 * Tüm gün anahtarları YEREL takvime göre 'YYYY-MM-DD' biçimindedir.
 * `new Date('2026-05-01')` UTC gece yarısı ürettiği için anahtarları
 * her zaman elle (yıl, ay, gün) ayrıştırırız; böylece saat dilimi kayması
 * (gün değişiminde bir gün geri/ileri kayma) oluşmaz.
 */

export const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;

export const TR_MONTHS_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
] as const;

/** 0 = Pazar ... 6 = Cumartesi (Date.getDay() ile aynı sıra). */
export const TR_WEEKDAYS = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi',
] as const;

export const TR_WEEKDAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;

function pad2(value: number): string {
  return value < 10 ? `0${value}` : value.toString();
}

/** Date nesnesini yerel gün anahtarına çevirir. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Bugünün yerel gün anahtarı. */
export function todayKey(): DateKey {
  return toDateKey(new Date());
}

/** 'YYYY-MM-DD' anahtarını yerel Date nesnesine çevirir (saat 00:00). */
export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map((part) => Number.parseInt(part, 10));
  return new Date(y || 1970, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/** Gün anahtarının geçerli biçimde olup olmadığını denetler. */
export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = parseDateKey(key);
  return toDateKey(date) === key;
}

/** Güne gün ekler/çıkarır. */
export function addDays(key: DateKey, days: number): DateKey {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** İki gün anahtarı arasındaki tam gün farkı (b - a). */
export function daysBetween(a: DateKey, b: DateKey): number {
  const first = parseDateKey(a).getTime();
  const second = parseDateKey(b).getTime();
  return Math.round((second - first) / 86_400_000);
}

/** 'YYYY-MM' ay anahtarı üretir. */
export function toMonthKey(key: DateKey): string {
  return key.slice(0, 7);
}

/** Verilen ayın ilk gününü döndürür. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/** Verilen ayın son gününü döndürür. */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 0, 0, 0, 0);
}

/** Haftanın başlangıcını (weekStartsOn: 0=Pazar,1=Pazartesi) döndürür. */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  result.setDate(result.getDate() - diff);
  return result;
}

/** Bugünden geriye doğru n günün anahtar dizisi (eskiden yeniye). */
export function lastNDays(n: number, from: DateKey = todayKey()): DateKey[] {
  const keys: DateKey[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(addDays(from, -i));
  }
  return keys;
}

/** 'YYYY-MM-DD' -> "1 Mayıs 2026". */
export function formatDateTR(key: DateKey): string {
  const date = parseDateKey(key);
  return `${date.getDate()} ${TR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** 'YYYY-MM-DD' -> "1 May". */
export function formatDateShortTR(key: DateKey): string {
  const date = parseDateKey(key);
  return `${date.getDate()} ${TR_MONTHS_SHORT[date.getMonth()]}`;
}

/** 'YYYY-MM-DD' -> "Mayıs 2026". */
export function formatMonthYearTR(key: DateKey): string {
  const date = parseDateKey(key);
  return `${TR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** 'YYYY-MM-DD' -> "Pzt". */
export function formatWeekdayTR(key: DateKey): string {
  return TR_WEEKDAYS_SHORT[parseDateKey(key).getDay()];
}

/** Bugün mü kontrolü. */
export function isToday(key: DateKey): boolean {
  return key === todayKey();
}

/** Tam tarih+saat damgası (ISO). */
export function nowIso(): string {
  return new Date().toISOString();
}

/** 'YYYY-MM-DD' anahtarını 'GG.AA.YYYY' giriş biçimine çevirir. */
export function formatDateInput(key: DateKey): string {
  const date = parseDateKey(key);
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/**
 * Kullanıcının Türkçe tarih girdisini ('GG.AA.YYYY' veya 'YYYY-MM-DD')
 * DateKey'e çevirir. Geçersizse null döner.
 */
export function parseDateInput(text: string): DateKey | null {
  const trimmed = text.trim();
  const dmy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  let day = 0;
  let month = 0;
  let year = 0;

  if (dmy !== null) {
    day = Number.parseInt(dmy[1] ?? '0', 10);
    month = Number.parseInt(dmy[2] ?? '0', 10);
    year = Number.parseInt(dmy[3] ?? '0', 10);
  } else if (iso !== null) {
    year = Number.parseInt(iso[1] ?? '0', 10);
    month = Number.parseInt(iso[2] ?? '0', 10);
    day = Number.parseInt(iso[3] ?? '0', 10);
  } else {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const candidate = `${year}-${pad2(month)}-${pad2(day)}`;
  return isValidDateKey(candidate) ? candidate : null;
}

/** Önceden tanımlı dönem seçeneğini tarih aralığına çevirir. */
export function rangeForPreset(
  preset: PeriodPresetType,
  reference: Date = new Date(),
): DateRange | null {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  switch (preset) {
    case PeriodPreset.ThisMonth:
      return {
        from: toDateKey(new Date(year, month, 1)),
        to: toDateKey(new Date(year, month + 1, 0)),
      };
    case PeriodPreset.LastMonth:
      return {
        from: toDateKey(new Date(year, month - 1, 1)),
        to: toDateKey(new Date(year, month, 0)),
      };
    case ExtendedPeriodPreset.Last3Months:
      return {
        from: toDateKey(new Date(year, month - 2, 1)),
        to: toDateKey(new Date(year, month + 1, 0)),
      };
    case ExtendedPeriodPreset.ThisYear:
      return {
        from: toDateKey(new Date(year, 0, 1)),
        to: toDateKey(new Date(year, 11, 31)),
      };
    case PeriodPreset.All:
      return null;
  }
}
