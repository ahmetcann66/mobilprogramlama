import type { DateKey, Minor, TransactionType } from './models';

/** İşlem listesi için tarih aralığı. `from`/`to` dahildir. */
export interface DateRange {
  readonly from: DateKey;
  readonly to: DateKey;
}

/** Finans ekranındaki gelişmiş filtre durumu. */
export interface TransactionFilter {
  readonly search: string;
  /** 'all' seçiliyse tür filtresi uygulanmaz. */
  readonly type: TransactionType | 'all';
  /** 'all' seçiliyse kategori filtresi uygulanmaz. */
  readonly categoryId: string | 'all';
  readonly range: DateRange | null;
}

/**
 * Dönem seçenekleri — "genişletilebilir enum" deseni.
 *
 * TypeScript `enum` değerlerine derleme zamanında üye eklenemez (miras
 * alınamazlar). Daha esnek yaklaşım: üyeler sabit (`as const`) bir nesnede
 * tutulur ve ilgili tip, nesnenin anahtarlarından türetilir. Böylece:
 *
 * - Yeni bir üye eklemek için nesneye bir satır eklemek yeterlidir; tip
 *   otomatik olarak güncellenir (tek kaynak ilkesi).
 * - Temel set, yayma (`...`) ile genişletilerek "temel + uzantı" hiyerarşisi
 *   kurulur. Ana ekran yalnızca `BasePeriodPreset`'i, Insights ekranı ise
 *   genişletilmiş `PeriodPreset`'i kullanır.
 */

/** Her ekranda geçerli olan temel dönemler. */
export const PeriodPreset = {
  ThisMonth: 'thisMonth',
  LastMonth: 'lastMonth',
  All: 'all',
} as const;

/** Temel setteki üyelerden türetilen tip. */
export type BasePeriodPreset = (typeof PeriodPreset)[keyof typeof PeriodPreset];

/** Yalnızca Insights'ta sunulan genişletilmiş dönemler. */
export const ExtendedPeriodPreset = {
  ...PeriodPreset,
  Last3Months: 'last3Months',
  ThisYear: 'thisYear',
} as const;

/** Genişletilmiş setteki üyelerden türetilen tip (`BasePeriodPreset`'in süper seti). */
// Değer (const) ile aynı adlı tip: const-object enum deseninin bilinçli çakışması.
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PeriodPreset = (typeof ExtendedPeriodPreset)[keyof typeof ExtendedPeriodPreset];

/** Bir döneme ait gelir/gider/net özeti. */
export interface Kpi {
  readonly income: Minor;
  readonly expense: Minor;
  readonly net: Minor;
}
