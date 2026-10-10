import type { Budget, Transaction } from '@/types';
import {
  budgetUsagePercent,
  computeBudgetUsage,
  computeCategoryBudgets,
  normalizeBudgetTotal,
  totalCategoryLimits,
} from '@/services/finance/budget';

function tx(partial: Partial<Transaction> & Pick<Transaction, 'id' | 'type' | 'amount' | 'date' | 'categoryId'>): Transaction {
  return { createdAt: '2026-05-01T10:00:00.000Z', ...partial };
}

const budget: Budget = {
  monthlyTotalMinor: 100000,
  categoryLimits: { market: 40000, transport: 20000 },
};

const txns: Transaction[] = [
  tx({ id: 'a', type: 'expense', amount: 45000, date: '2026-05-01', categoryId: 'market' }),
  tx({ id: 'b', type: 'expense', amount: 10000, date: '2026-05-02', categoryId: 'transport' }),
];

describe('computeBudgetUsage', () => {
  it('bütçe tanımlıysa kullanım oranını hesaplar', () => {
    const usage = computeBudgetUsage(budget, txns);
    expect(usage.hasBudget).toBe(true);
    expect(usage.spentMinor).toBe(55000);
    expect(usage.remainingMinor).toBe(45000);
    expect(usage.usage).toBeCloseTo(0.55);
    expect(usage.overBudget).toBe(false);
  });

  it('aşımı doğru işaretler ve oranı 1e kırpar', () => {
    const small: Budget = { monthlyTotalMinor: 50000, categoryLimits: {} };
    const usage = computeBudgetUsage(small, txns);
    expect(usage.overBudget).toBe(true);
    expect(usage.remainingMinor).toBe(-5000);
    expect(usage.usage).toBe(1);
  });

  it('bütçe yoksa (0) hasBudget false döner', () => {
    const usage = computeBudgetUsage({ monthlyTotalMinor: 0, categoryLimits: {} }, txns);
    expect(usage.hasBudget).toBe(false);
    expect(usage.usage).toBe(0);
    expect(usage.overBudget).toBe(false);
  });

  it('aralıkla sınırlar', () => {
    const usage = computeBudgetUsage(budget, txns, { from: '2026-05-02', to: '2026-05-31' });
    expect(usage.spentMinor).toBe(10000);
  });
});

describe('computeCategoryBudgets', () => {
  it('limit tanımlı kategorileri kullanım oranına göre sıralar', () => {
    const rows = computeCategoryBudgets(budget, txns);
    expect(rows.map((r) => r.categoryId)).toEqual(['market', 'transport']);
    expect(rows[0]?.overBudget).toBe(true);
    expect(rows[1]?.overBudget).toBe(false);
  });

  it('limit 0 olan kategorileri atlar', () => {
    const rows = computeCategoryBudgets({ monthlyTotalMinor: 0, categoryLimits: { market: 0 } }, txns);
    expect(rows).toHaveLength(0);
  });
});

describe('yardımcılar', () => {
  it('bütçe yoksa yüzde 0 döner', () => {
    expect(budgetUsagePercent({ spentMinor: 0, totalMinor: 0, remainingMinor: 0, usage: 0, overBudget: false, hasBudget: false })).toBe(0);
  });

  it('normalizeBudgetTotal negatifi 0 yapar', () => {
    expect(normalizeBudgetTotal(-100)).toBe(0);
  });

  it('kategori limitlerini toplar', () => {
    expect(totalCategoryLimits(budget)).toBe(60000);
  });
});
