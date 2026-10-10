import type { Debt, DebtPayment, Minor } from '@/types';
import { sumMinor } from '@/utils/money';

/**
 * Borç iş mantığı — saf fonksiyonlar.
 *
 * MUHASEBE NOTU: Bir borca yapılan ödeme genel gider DEĞİLDİR; para yok
 * olmaz, pasiften aktif varlığa aktarılır. Bu yüzden ödemeler gider
 * toplamlarına eklenmez (yalnızca kullanıcı isterse opsiyonel bir gider
 * işlemi olarak da kaydedilebilir). Güncel kalan bakiye tek formülle
 * (`currentBalanceMinor`) türetilir; ödeme silindiğinde bakiye otomatik
 * geri gelir.
 */

/** Bir borca ait ödeme kayıtları, en yeniden eskiye. */
export function paymentsFor(
  payments: readonly DebtPayment[],
  debtId: string,
): DebtPayment[] {
  return payments
    .filter((payment) => payment.debtId === debtId)
    .sort((a, b) =>
      a.date === b.date
        ? a.createdAt < b.createdAt
          ? 1
          : -1
        : a.date < b.date
          ? 1
          : -1,
    );
}

/** Bir borca yapılan toplam geri ödeme (kuruş). */
export function totalPaidMinor(payments: readonly DebtPayment[]): Minor {
  return sumMinor(payments.map((payment) => payment.amountMinor));
}

/** Güncel kalan bakiye: açılış bakiyesi − toplam ödeme (0'ın altına inmez). */
export function currentBalanceMinor(
  debt: Pick<Debt, 'balanceMinor'>,
  payments: readonly DebtPayment[],
): Minor {
  return Math.max(0, debt.balanceMinor - totalPaidMinor(payments));
}

export interface DebtSummary {
  readonly activeCount: number;
  /** Aktif borçların güncel toplam kalan bakiyesi. */
  readonly remainingTotalMinor: Minor;
  /** Aktif borçlar için planlanan toplam aylık ödeme. */
  readonly paymentTotalMinor: Minor;
  /** Arşivlenen (kapatılan) borç sayısı. */
  readonly archivedCount: number;
}

/** Aktif borçların toplu özeti (listeleme ve finans ekranı için). */
export function summarizeDebts(
  debts: readonly Debt[],
  payments: readonly DebtPayment[],
): DebtSummary {
  const active = debts.filter((debt) => !debt.archived);
  const remainingTotalMinor = sumMinor(
    active.map((debt) => currentBalanceMinor(debt, paymentsFor(payments, debt.id))),
  );
  return {
    activeCount: active.length,
    remainingTotalMinor,
    paymentTotalMinor: sumMinor(active.map((debt) => debt.paymentMinor)),
    archivedCount: debts.length - active.length,
  };
}

/** Yeni ödeme kaydı ekler. */
export function addDebtPayment(
  payments: readonly DebtPayment[],
  payment: DebtPayment,
): DebtPayment[] {
  return [payment, ...payments];
}

/** Ödeme kaydını siler. */
export function removeDebtPayment(
  payments: readonly DebtPayment[],
  id: string,
): DebtPayment[] {
  return payments.filter((payment) => payment.id !== id);
}