import type { DateKey, Debt, DebtPayment, Minor } from '@/types';
import { toDateKey } from '@/utils/date';
import { currentBalanceMinor } from './debts';

/**
 * Borç kapanış (payoff) simülasyonu — saf fonksiyonlar.
 *
 * Sabit aylık ödeme `M`, aylık faiz `i` ve güncel bakiye `B` için kalan
 * ay sayısı ay bazlı amortisman simülasyonuyla bulunur. Her ay bakiyeye
 * faiz işletilir ve planlanan ödeme düşülür; son ay ödeme kalan bakiyeyi
 * kapatacak kadar olabilir (tam `M` olmak zorunda değildir).
 *
 *   bakiye_{t+1} = bakiye_t · (1 + i) − M
 *
 * Aylık ödeme aylık faizini (`bakiye · i`) karşılamıyorsa bakiye asla
 * azalmaz; bu durumda `payable: false` döner. Güvenlik için 1200 ay (100
 * yıl) simülasyon üst sınırı uygulanır.
 */

/** Simülasyon tavanı: 100 yıllık plan üst sınır sayılır, aşılırsa plan yoktur. */
const MAX_MONTHS = 1200;

export interface PayoffPlan {
  /** Aylık ödemeyle bitişi sağlayan taksit sayısı; hesaplanamıyorsa null. */
  readonly months: number | null;
  /** Bitiş tarihi (o ayın son günü); hesaplanamıyorsa null. */
  readonly endDate: DateKey | null;
  /** Tahmini toplam ödeme (anapara + faiz). */
  readonly totalPaymentMinor: Minor;
  /** Tahmini toplam faiz (0'dan aşağı inmez). */
  readonly totalInterestMinor: Minor;
  /** Ödeme planı anlamlı mı (aylık ödeme tanımlı ve faizi aşıyor mu). */
  readonly payable: boolean;
  /** Bakiye çoktan kapanmış mı (güncel kalan 0). */
  readonly settled: boolean;
}

/** Verilen planla borcun ne zaman kapanacağını hesaplar. */
export function payoffPlan(
  debt: Pick<Debt, 'balanceMinor' | 'monthlyRate' | 'paymentMinor'>,
  payments: readonly DebtPayment[],
  reference: Date = new Date(),
): PayoffPlan {
  const balance = currentBalanceMinor(debt, payments);
  if (balance <= 0) {
    return {
      months: null,
      endDate: null,
      totalPaymentMinor: 0,
      totalInterestMinor: 0,
      payable: false,
      settled: true,
    };
  }

  const payment = debt.paymentMinor;
  const rate = debt.monthlyRate;
  if (!Number.isFinite(payment) || payment <= 0 || !Number.isFinite(rate) || rate < 0) {
    return {
      months: null,
      endDate: null,
      totalPaymentMinor: balance,
      totalInterestMinor: 0,
      payable: false,
      settled: false,
    };
  }

  const monthlyInterest = Math.round(balance * rate);
  if (payment <= monthlyInterest) {
    // Ödeme faizi dahi karşılamıyor; bakiye bu planda kapanmaz.
    return {
      months: null,
      endDate: null,
      totalPaymentMinor: balance,
      totalInterestMinor: 0,
      payable: false,
      settled: false,
    };
  }

  // Ay bazlı amortisman: her ay faiz işler, aylık ödeme düşülür. Son ay
  // kalan bakiye < ödeme olduğunda doğal yoldan kapanır ve toplam faiz,
  // ödenen her ayın faizinin toplamından gelir (M·n − B varsayımından kaçınır).
  let remaining = balance;
  let months = 0;
  let totalInterest = 0;
  while (remaining > 0 && months < MAX_MONTHS) {
    const interest = Math.round(remaining * rate);
    if (payment <= interest) {
      remaining = remaining + interest - payment; // azalmaz / artar
      break;
    }
    remaining = remaining + interest - payment;
    totalInterest += interest;
    months += 1;
  }

  if (remaining > 0) {
    return {
      months: null,
      endDate: null,
      totalPaymentMinor: balance,
      totalInterestMinor: 0,
      payable: false,
      settled: false,
    };
  }

  const year = reference.getFullYear();
  const month = reference.getMonth();

  return {
    months,
    endDate: toDateKey(new Date(year, month + months, 0)),
    totalPaymentMinor: balance + totalInterest,
    totalInterestMinor: totalInterest,
    payable: true,
    settled: false,
  };
}