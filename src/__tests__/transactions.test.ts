import type { Transaction, TransactionFilter } from '@/types';
import {
  calculateExpenses,
  calculateIncome,
  calculateNet,
  filterTransactions,
  groupByMonth,
  sortByDateDesc,
  sumByCategory,
} from '@/services/finance/transactions';

function tx(partial: Partial<Transaction> & Pick<Transaction, 'id' | 'type' | 'amount' | 'date' | 'categoryId'>): Transaction {
  return { createdAt: '2026-05-01T10:00:00.000Z', ...partial };
}

const DATA: Transaction[] = [
  tx({ id: 't1', type: 'income', amount: 100000, date: '2026-05-01', categoryId: 'salary', note: 'Maaş' }),
  tx({ id: 't2', type: 'expense', amount: 25000, date: '2026-05-03', categoryId: 'market', note: 'Market' }),
  tx({ id: 't3', type: 'expense', amount: 10000, date: '2026-05-10', categoryId: 'market', note: 'Bakkal' }),
  tx({ id: 't4', type: 'expense', amount: 5000, date: '2026-04-20', categoryId: 'transport', note: 'Taksi' }),
];

describe('toplamlar', () => {
  it('geliri hesaplar', () => {
    expect(calculateIncome(DATA)).toBe(100000);
  });

  it('gideri hesaplar', () => {
    expect(calculateExpenses(DATA)).toBe(40000);
  });

  it('aralıkla sınırlar', () => {
    expect(calculateExpenses(DATA, { from: '2026-05-01', to: '2026-05-31' })).toBe(35000);
  });

  it('net farkı hesaplar (negatif olabilir)', () => {
    expect(calculateNet(DATA)).toBe(60000);
  });

  it('boş listede sıfır döner', () => {
    expect(calculateNet([])).toBe(0);
  });
});

describe('sortByDateDesc', () => {
  it('en yeniden eskiye sıralar', () => {
    const sorted = sortByDateDesc(DATA);
    expect(sorted.map((t) => t.id)).toEqual(['t3', 't2', 't1', 't4']);
  });

  it('girdi dizisini değiştirmez', () => {
    const copy = [...DATA];
    sortByDateDesc(DATA);
    expect(DATA).toEqual(copy);
  });
});

describe('filterTransactions', () => {
  const base: TransactionFilter = { search: '', type: 'all', categoryId: 'all', range: null };

  it('türe göre filtreler', () => {
    const result = filterTransactions(DATA, { ...base, type: 'expense' });
    expect(result).toHaveLength(3);
  });

  it('kategoriye göre filtreler', () => {
    const result = filterTransactions(DATA, { ...base, categoryId: 'market' });
    expect(result.map((t) => t.id)).toEqual(['t2', 't3']);
  });

  it('açıklamada Türkçe harf duyarsız arar', () => {
    const result = filterTransactions(DATA, { ...base, search: 'MAAŞ' });
    expect(result.map((t) => t.id)).toEqual(['t1']);
  });

  it('tarih aralığına göre filtreler', () => {
    const result = filterTransactions(DATA, { ...base, range: { from: '2026-05-01', to: '2026-05-31' } });
    expect(result.map((t) => t.id)).toEqual(['t1', 't2', 't3']);
  });

  it('filtreleri birlikte uygular', () => {
    const result = filterTransactions(DATA, { ...base, type: 'expense', categoryId: 'market', search: 'bakkal' });
    expect(result.map((t) => t.id)).toEqual(['t3']);
  });
});

describe('sumByCategory', () => {
  it('gideri kategori bazında toplar', () => {
    expect(sumByCategory(DATA, 'expense')).toEqual({ market: 35000, transport: 5000 });
  });
});

describe('groupByMonth', () => {
  it('gelir/gideri aya göre gruplar', () => {
    const grouped = groupByMonth(DATA);
    expect(grouped['2026-05']).toEqual({ income: 100000, expense: 35000 });
    expect(grouped['2026-04']).toEqual({ income: 0, expense: 5000 });
  });
});
