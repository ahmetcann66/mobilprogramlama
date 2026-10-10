import type { AppData, Habit, HabitCompletion, SavingsContribution, SavingsGoal, Transaction } from '@/types';
import { addDays, nowIso, todayKey } from '@/utils/date';
import { createId } from '@/utils/id';
import { createInitialData } from './storage';

/**
 * DEMO VERİSİ ÜRETECİ.
 *
 * Bu fonksiyon yalnızca kullanıcı Ayarlar ekranından "Demo verisi yükle"
 * dediğinde çağrılır. Varsayılan durum her zaman boştur; böylece kullanıcıya
 * gerçekmiş gibi sahte bir finansal geçmiş gösterilmez. Tüm tutarlar bugüne
 * göreli tarihlerle üretilir ki grafikler anlamlı görünsün.
 */

interface SeedTx {
  readonly offsetDays: number;
  readonly type: Transaction['type'];
  readonly amountMinor: number;
  readonly categoryId: string;
  readonly note?: string;
}

const SEED_TRANSACTIONS: readonly SeedTx[] = [
  { offsetDays: -1, type: 'expense', amountMinor: 18550, categoryId: 'market', note: 'Haftalık market' },
  { offsetDays: -2, type: 'expense', amountMinor: 4200, categoryId: 'transport', note: 'Metro kart yükleme' },
  { offsetDays: -3, type: 'expense', amountMinor: 9800, categoryId: 'food', note: 'Arkadaşlarla akşam yemeği' },
  { offsetDays: -5, type: 'income', amountMinor: 1200000, categoryId: 'salary', note: 'Aylık maaş' },
  { offsetDays: -6, type: 'expense', amountMinor: 65000, categoryId: 'bills', note: 'Elektrik faturası' },
  { offsetDays: -8, type: 'expense', amountMinor: 23500, categoryId: 'shopping', note: 'Kıyafet' },
  { offsetDays: -10, type: 'expense', amountMinor: 12000, categoryId: 'education', note: 'Kitap' },
  { offsetDays: -12, type: 'income', amountMinor: 150000, categoryId: 'extra', note: 'Serbest iş ödemesi' },
  { offsetDays: -14, type: 'expense', amountMinor: 7800, categoryId: 'entertainment', note: 'Sinema' },
  { offsetDays: -18, type: 'expense', amountMinor: 31200, categoryId: 'market', note: 'Market' },
  { offsetDays: -22, type: 'expense', amountMinor: 45000, categoryId: 'health', note: 'Vitamin / eczane' },
  { offsetDays: -28, type: 'income', amountMinor: 1200000, categoryId: 'salary', note: 'Aylık maaş' },
  { offsetDays: -30, type: 'expense', amountMinor: 61000, categoryId: 'bills', note: 'İnternet + su' },
  { offsetDays: -35, type: 'expense', amountMinor: 27500, categoryId: 'transport', note: 'Taksi' },
  { offsetDays: -40, type: 'expense', amountMinor: 89000, categoryId: 'shopping', note: 'Elektronik aksesuar' },
  { offsetDays: -45, type: 'income', amountMinor: 200000, categoryId: 'gift', note: 'Doğum günü hediyesi' },
  { offsetDays: -55, type: 'income', amountMinor: 1200000, categoryId: 'salary', note: 'Aylık maaş' },
  { offsetDays: -58, type: 'expense', amountMinor: 34000, categoryId: 'food', note: 'Market & yemek' },
];

const SEED_HABITS: readonly Omit<Habit, 'id' | 'createdAt'>[] = [
  { name: 'Günlük harcamalarımı kaydet', description: 'Gün sonunda tüm harcamaları gir', category: 'finance', frequency: 'daily', active: true },
  { name: 'Günlük bütçemi kontrol et', description: 'Kalan bütçeyi gözden geçir', category: 'finance', frequency: 'daily', active: true },
  { name: '20 dakika kitap oku', category: 'learning', frequency: 'daily', active: true },
  { name: 'Gereksiz alışverişten kaçın', category: 'finance', frequency: 'daily', active: true },
  { name: 'Haftalık birikimi gözden geçir', category: 'finance', frequency: 'weekly', active: true },
];

/** Belirli gün ofsetlerinde tamamlanmış alışkanlık desenleri (demo). */
const SEED_COMPLETION_PATTERN: Readonly<Record<number, readonly number[]>> = {
  0: [0, 1, 2, 3], // bugün 4/4 değil; bazıları
  1: [0, 1, 2, 3],
  2: [1, 2, 3],
  3: [0, 1, 2, 3],
  4: [0, 2, 3],
  5: [0, 1, 2, 3],
  6: [1, 2],
  7: [0, 1, 2, 3],
  8: [0, 1, 2, 3],
  9: [0, 2, 3],
  10: [0, 1, 2, 3],
  11: [1, 3],
  12: [0, 1, 2, 3],
};

export function createDemoData(): AppData {
  const base = createInitialData();
  const today = todayKey();

  const transactions: Transaction[] = SEED_TRANSACTIONS.map((seed) => {
    const tx: Transaction = {
      id: createId('tx'),
      type: seed.type,
      amount: seed.amountMinor,
      categoryId: seed.categoryId,
      date: addDays(today, seed.offsetDays),
      createdAt: nowIso(),
      ...(seed.note !== undefined ? { note: seed.note } : {}),
    };
    return tx;
  });

  const habits: Habit[] = SEED_HABITS.map((habit) => ({
    ...habit,
    id: createId('habit'),
    createdAt: nowIso(),
  }));

  const completions: HabitCompletion[] = [];
  for (const [offsetStr, doneIndices] of Object.entries(SEED_COMPLETION_PATTERN)) {
    const offset = Number.parseInt(offsetStr, 10);
    const date = addDays(today, -offset);
    for (const index of doneIndices) {
      const habit = habits[index];
      if (habit === undefined) continue; // koleksiyon sınırı güvenliği
      completions.push({
        id: createId('cmp'),
        habitId: habit.id,
        date,
        completedAt: nowIso(),
      });
    }
  }

  const goals: SavingsGoal[] = [
    {
      id: createId('goal'),
      name: 'Acil durum fonu',
      targetMinor: 1500000,
      initialMinor: 350000,
      deadline: addDays(today, 180),
      note: '3 aylık gider karşılığı',
      status: 'active',
      createdAt: nowIso(),
    },
    {
      id: createId('goal'),
      name: 'Yeni bilgisayar',
      targetMinor: 4500000,
      initialMinor: 800000,
      status: 'active',
      createdAt: nowIso(),
    },
  ];

  const contributions: SavingsContribution[] = goals.map((goal, index) => ({
    id: createId('contrib'),
    goalId: goal.id,
    amountMinor: index === 0 ? 120000 : 250000,
    date: addDays(today, -10),
    createdAt: nowIso(),
  }));

  return {
    ...base,
    transactions,
    habits,
    completions,
    goals,
    contributions,
    budget: {
      monthlyTotalMinor: 2500000,
      categoryLimits: {
        market: 900000,
        food: 400000,
        transport: 250000,
        entertainment: 200000,
      },
    },
    preferences: { ...base.preferences, displayName: 'Ahmet' },
  };
}
