import { payoffPlan } from '@/services/debts/payoff';

function makeDebt(partial: Partial<{ balanceMinor: number; monthlyRate: number; paymentMinor: number }>): {
  balanceMinor: number;
  monthlyRate: number;
  paymentMinor: number;
} {
  return {
    balanceMinor: 0,
    monthlyRate: 0,
    paymentMinor: 0,
    ...partial,
  };
}

describe('payoffPlan', () => {
  it('faizsiz borçta aylık ödemeye göre taksit sayısını hesaplar', () => {
    const plan = payoffPlan(makeDebt({ balanceMinor: 12000, paymentMinor: 1000 }), []);
    expect(plan.payable).toBe(true);
    expect(plan.months).toBe(12);
    expect(plan.totalPaymentMinor).toBe(12000);
    expect(plan.totalInterestMinor).toBe(0);
  });

  it('faizli borçta taksit sayısını ve faizi amortisman simülasyonuyla verir', () => {
    // B=10000, M=1000, i=%2 → 12 ay; son ay tam M değil kalan bakiye ödenir.
    const plan = payoffPlan(
      makeDebt({ balanceMinor: 10000, monthlyRate: 0.02, paymentMinor: 1000 }),
      [],
      new Date(2026, 4, 15),
    );
    expect(plan.payable).toBe(true);
    expect(plan.months).toBe(12);
    expect(plan.endDate).toBe('2027-04-30');
    // Toplam faiz = her ay bakiye·i toplamı = 1271; toplam ödeme = anapara + faiz.
    expect(plan.totalInterestMinor).toBe(1271);
    expect(plan.totalPaymentMinor).toBe(11271);
  });

  it('faizli borçta son taksit kalan bakiyedir ve toplam M·n ile şişirilmez', () => {
    // B=1000, M=1000, i=%2 → ilk ay 1020 olur; 1000 ödenince 20 kalır,
    // ikinci ödemeyle kapanır. Faiz yalnızca bir aylık işler.
    const plan = payoffPlan(
      makeDebt({ balanceMinor: 1000, monthlyRate: 0.02, paymentMinor: 1000 }),
      [],
      new Date(2026, 4, 15),
    );
    expect(plan.payable).toBe(true);
    expect(plan.months).toBe(2);
    expect(plan.endDate).toBe('2026-06-30');
    expect(plan.totalInterestMinor).toBe(20);
    expect(plan.totalPaymentMinor).toBe(1020);
  });

  it('ödemeler bakiyeyi düşer ve planı kısaltır', () => {
    const payments = [{ id: 'p1', debtId: 'd1', amountMinor: 5000, date: '2026-01-10', createdAt: '' }];
    const plan = payoffPlan(
      makeDebt({ balanceMinor: 20000, monthlyRate: 0.02, paymentMinor: 1000 }),
      payments,
      new Date(2026, 4, 15),
    );
    // Güncel bakiye 15000, faiz 300; ödeme 1000 > 300 → hesaplanabilir.
    expect(plan.payable).toBe(true);
    expect(plan.months).not.toBeNull();
    expect(plan.totalInterestMinor).toBeGreaterThan(0);
  });

  it('ödeme aylık faizi karşılamıyorsa plan hesaplanamaz (payable=false)', () => {
    const plan = payoffPlan(
      makeDebt({ balanceMinor: 10000, monthlyRate: 0.02, paymentMinor: 100 }),
      [],
    );
    expect(plan.payable).toBe(false);
    expect(plan.months).toBeNull();
    expect(plan.endDate).toBeNull();
  });

  it('aylık ödeme belirlenmezse plan hesaplanamaz', () => {
    const plan = payoffPlan(makeDebt({ balanceMinor: 10000, monthlyRate: 0.02 }), []);
    expect(plan.payable).toBe(false);
    expect(plan.months).toBeNull();
  });

  it('bakiye kapandıysa settled döner', () => {
    const payments = [{ id: 'p1', debtId: 'd1', amountMinor: 10000, date: '2026-01-10', createdAt: '' }];
    const plan = payoffPlan(makeDebt({ balanceMinor: 10000, monthlyRate: 0.02, paymentMinor: 1000 }), payments);
    expect(plan.settled).toBe(true);
    expect(plan.months).toBeNull();
    expect(plan.totalPaymentMinor).toBe(0);
  });

  it('negatif ayarlı faiz girilse plan güvenli biçimde pasif kalır', () => {
    const plan = payoffPlan(
      makeDebt({ balanceMinor: 5000, monthlyRate: -0.5, paymentMinor: 1000 }),
      [],
    );
    expect(plan.payable).toBe(false);
  });
});