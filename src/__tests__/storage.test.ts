import { createInitialData, isKnownCategoryKind, sanitizeAppData } from '@/services/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('sanitizeAppData', () => {
  it('kayıt olmayan girdide başlangıç verisi döner', () => {
    expect(sanitizeAppData(null)).toEqual(createInitialData());
    expect(sanitizeAppData('bozuk')).toEqual(createInitialData());
    expect(sanitizeAppData(42)).toEqual(createInitialData());
  });

  it('geçerli işlemleri korur, geçersizleri ayıklar', () => {
    const result = sanitizeAppData({
      transactions: [
        { id: 't1', type: 'expense', amount: 1250, categoryId: 'market', date: '2026-05-01' },
        { id: '', type: 'expense', amount: 1250, categoryId: 'market', date: '2026-05-01' },
        { id: 't3', type: 'expense', amount: 0, categoryId: 'market', date: '2026-05-01' },
        { id: 't4', type: 'bilinmeyen', amount: 1250, categoryId: 'market', date: '2026-05-01' },
        { id: 't5', type: 'expense', amount: 1250, categoryId: 'market', date: '2026-13-01' },
      ],
    });
    expect(result.transactions.map((t) => t.id)).toEqual(['t1']);
  });

  it('bilinmeyen alışkanlığa ait tamamlanmaları ayıklar', () => {
    const result = sanitizeAppData({
      habits: [{ id: 'h1', name: 'Spor' }],
      completions: [
        { id: 'c1', habitId: 'h1', date: '2026-05-01' },
        { id: 'c2', habitId: 'yok', date: '2026-05-01' },
      ],
    });
    expect(result.completions.map((c) => c.id)).toEqual(['c1']);
  });

  it('bilinmeyen hedefe ait katkıları ayıklar', () => {
    const result = sanitizeAppData({
      goals: [{ id: 'g1', name: 'Araba', targetMinor: 100000 }],
      contributions: [
        { id: 'c1', goalId: 'g1', amountMinor: 1000, date: '2026-05-01' },
        { id: 'c2', goalId: 'yok', amountMinor: 1000, date: '2026-05-01' },
      ],
    });
    expect(result.contributions.map((c) => c.id)).toEqual(['c1']);
  });

  it('geçersiz tercihleri güvenli varsayılanlara çeker', () => {
    const result = sanitizeAppData({ preferences: { currency: 123, weekStartsOn: 9, theme: 'turquoise' } });
    expect(typeof result.preferences.currency).toBe('string');
    expect([0, 1]).toContain(result.preferences.weekStartsOn);
    expect(result.preferences.theme).toBe('dark');
  });

  it('negatif kategori limitlerini temizler', () => {
    const result = sanitizeAppData({ budget: { monthlyTotalMinor: -5, categoryLimits: { market: 1000, transport: -2 } } });
    expect(result.budget.monthlyTotalMinor).toBe(0);
    expect(result.budget.categoryLimits).toEqual({ market: 1000 });
  });

  it('şema sürümünü normalize eder', () => {
    const result = sanitizeAppData({ version: 999 });
    expect(result.version).toBe(createInitialData().version);
  });

  it('kumbara bayrağını ve işlem bağlantılı katkıyı korur', () => {
    const result = sanitizeAppData({
      goals: [{ id: 'g1', name: 'Kumbara', targetMinor: 100000, initialMinor: 0, roundUpEnabled: true }],
      contributions: [
        { id: 'c1', goalId: 'g1', amountMinor: 50, date: '2026-05-01', transactionId: 't1' },
      ],
    });
    expect(result.goals[0]?.roundUpEnabled).toBe(true);
    expect(result.contributions[0]?.transactionId).toBe('t1');
  });

  it('kumbara bayrağı yoksa alanı üretmez', () => {
    const result = sanitizeAppData({
      goals: [{ id: 'g1', name: 'Birikim', targetMinor: 100000, initialMinor: 0 }],
    });
    expect(result.goals[0]?.roundUpEnabled).toBeUndefined();
  });
});

describe('isKnownCategoryKind', () => {
  it('geçerli türleri kabul eder', () => {
    expect(isKnownCategoryKind('income')).toBe(true);
    expect(isKnownCategoryKind('expense')).toBe(true);
    expect(isKnownCategoryKind('both')).toBe(true);
  });

  it('geçersizleri reddeder', () => {
    expect(isKnownCategoryKind('foo')).toBe(false);
    expect(isKnownCategoryKind(1)).toBe(false);
  });
});
