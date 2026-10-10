import {
  addDebtPayment,
  currentBalanceMinor,
  paymentsFor,
  removeDebtPayment,
  summarizeDebts,
  totalPaidMinor,
} from '@/services/debts/debts';
import type { DebtPayment } from '@/types';

const DEBT_A = { id: 'a', name: 'Kredi kartı', balanceMinor: 20000, monthlyRate: 0.02, paymentMinor: 1000, archived: false, createdAt: '' };
const DEBT_B = { id: 'b', name: 'Kapalı borç', balanceMinor: 5000, monthlyRate: 0, paymentMinor: 0, archived: true, createdAt: '' };

function payment(id: string, debtId: string, amountMinor: number, date: string, createdAt: string): DebtPayment {
  return { id, debtId, amountMinor, date, createdAt };
}

describe('paymentsFor', () => {
  it('borca ait ödemeleri en yeniden eskiye sıralar', () => {
    const payments = [
      payment('p1', 'a', 100, '2026-03-01', 'a'),
      payment('p2', 'a', 200, '2026-05-01', 'b'),
      payment('p3', 'b', 50, '2026-04-01', 'c'),
      payment('p4', 'a', 300, '2026-04-01', 'd'),
    ];
    const list = paymentsFor(payments, 'a');
    expect(list.map((p) => p.id)).toEqual(['p2', 'p4', 'p1']);
  });
});

describe('totalPaidMinor / currentBalanceMinor', () => {
  it('toplam ödeme ve güncel bakiyeyi hesaplar', () => {
    const payments = [
      payment('p1', 'a', 3000, '2026-01-01', ''),
      payment('p2', 'a', 2000, '2026-02-01', ''),
    ];
    expect(totalPaidMinor(payments)).toBe(5000);
    expect(currentBalanceMinor(DEBT_A, payments)).toBe(15000);
  });

  it('bakiye 0ın altına inmez', () => {
    const payments = [payment('p1', 'a', 25000, '2026-01-01', '')];
    expect(currentBalanceMinor(DEBT_A, payments)).toBe(0);
  });

  it('ödeme yokken açılış bakiyesini verir', () => {
    expect(currentBalanceMinor(DEBT_A, [])).toBe(20000);
  });
});

describe('addDebtPayment / removeDebtPayment', () => {
  it('ödeme ekler ve siler', () => {
    const first = payment('p1', 'a', 100, '2026-01-01', '');
    const second = payment('p2', 'a', 200, '2026-02-01', '');
    const afterAdd = addDebtPayment([first], second);
    expect(afterAdd.map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(removeDebtPayment(afterAdd, 'p1').map((p) => p.id)).toEqual(['p2']);
  });
});

describe('summarizeDebts', () => {
  it('yalnızca aktif borçların toplamını ve sayısını özetler', () => {
    const payments = [payment('p1', 'a', 5000, '2026-01-01', '')];
    const summary = summarizeDebts([DEBT_A, DEBT_B], payments);
    expect(summary.activeCount).toBe(1);
    expect(summary.archivedCount).toBe(1);
    expect(summary.remainingTotalMinor).toBe(15000);
    expect(summary.paymentTotalMinor).toBe(1000);
  });

  it('boş listede güvenli sıfır döner', () => {
    const summary = summarizeDebts([], []);
    expect(summary).toEqual({ activeCount: 0, remainingTotalMinor: 0, paymentTotalMinor: 0, archivedCount: 0 });
  });
});