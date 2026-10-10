import type { Habit, HabitCompletion } from '@/types';
import {
  activeHabits,
  calculateHabitStreak,
  dailyCompletionPercent,
  deleteHabit,
  isCompletedOn,
  recentCompletionMap,
  toggleCompletion,
  weekCompletedCount,
  weeklyProgress,
} from '@/services/habits/habits';

function habit(id: string, active = true): Habit {
  return {
    id,
    name: id,
    category: 'finance',
    frequency: 'daily',
    active,
    createdAt: '2026-05-01T10:00:00.000Z',
  };
}

function completion(id: string, habitId: string, date: string): HabitCompletion {
  return { id, habitId, date, completedAt: `${date}T09:00:00.000Z` };
}

describe('toggleCompletion', () => {
  it('yoksa ekler', () => {
    const result = toggleCompletion([], 'h1', '2026-05-01', 'c1', '2026-05-01T09:00:00.000Z');
    expect(result).toHaveLength(1);
    expect(isCompletedOn(result, 'h1', '2026-05-01')).toBe(true);
  });

  it('varsa kaldırır (aynı gün tekrar sayılmaz)', () => {
    const start = [completion('c1', 'h1', '2026-05-01')];
    const result = toggleCompletion(start, 'h1', '2026-05-01', 'c2', '2026-05-01T10:00:00.000Z');
    expect(result).toHaveLength(0);
  });

  it('farklı günü etkilemez', () => {
    const start = [completion('c1', 'h1', '2026-05-01')];
    const result = toggleCompletion(start, 'h1', '2026-05-02', 'c2', '2026-05-02T10:00:00.000Z');
    expect(result).toHaveLength(2);
  });
});

describe('calculateHabitStreak', () => {
  it('kesintisiz günleri sayar', () => {
    const data = [
      completion('c1', 'h1', '2026-05-01'),
      completion('c2', 'h1', '2026-05-02'),
      completion('c3', 'h1', '2026-05-03'),
    ];
    expect(calculateHabitStreak(data, 'h1', '2026-05-03')).toBe(3);
  });

  it('bugün tamamlanmadıysa dünkü seriden devam eder', () => {
    const data = [
      completion('c1', 'h1', '2026-05-01'),
      completion('c2', 'h1', '2026-05-02'),
    ];
    expect(calculateHabitStreak(data, 'h1', '2026-05-03')).toBe(2);
  });

  it('aradaki boşlukta seriyi durdurur', () => {
    const data = [
      completion('c1', 'h1', '2026-05-01'),
      completion('c2', 'h1', '2026-05-03'),
    ];
    expect(calculateHabitStreak(data, 'h1', '2026-05-03')).toBe(1);
  });

  it('hiç kayıt yoksa 0 döner', () => {
    expect(calculateHabitStreak([], 'h1', '2026-05-03')).toBe(0);
  });
});

describe('dailyCompletionPercent', () => {
  it('aktif alışkanlıklar üzerinden yüzde hesaplar', () => {
    const habits = [habit('h1'), habit('h2')];
    const data = [completion('c1', 'h1', '2026-05-01')];
    expect(dailyCompletionPercent(habits, data, '2026-05-01')).toBe(50);
  });

  it('alışkanlık yoksa 0 döner (sıfıra bölme koruması)', () => {
    expect(dailyCompletionPercent([], [], '2026-05-01')).toBe(0);
  });
});

describe('weekCompletedCount / weeklyProgress', () => {
  const habits = [habit('h1'), habit('h2'), habit('h3', false)];
  const data = [
    completion('c1', 'h1', '2026-05-01'),
    completion('c2', 'h2', '2026-05-02'),
    completion('c3', 'h3', '2026-05-02'),
  ];

  it('yalnızca aktif alışkanlıkları ve hafta aralığını sayar', () => {
    // 2026-05-03 Pazar; weekStartsOn=1 (Pazartesi) ise hafta 2026-04-27'de başlar.
    expect(weekCompletedCount(habits, data, 1, '2026-05-03')).toBe(2);
  });

  it('haftalık ilerleme yüzdesini verir', () => {
    const progress = weeklyProgress(habits, data, 1, '2026-05-03');
    expect(progress.completed).toBe(2);
    expect(progress.total).toBeGreaterThan(0);
    expect(progress.percent).toBeGreaterThan(0);
  });
});

describe('deleteHabit', () => {
  it('alışkanlığı ve ona ait tamamlanmaları birlikte siler', () => {
    const habits = [habit('h1'), habit('h2')];
    const data = [completion('c1', 'h1', '2026-05-01'), completion('c2', 'h2', '2026-05-01')];
    const result = deleteHabit(habits, data, 'h1');
    expect(result.habits.map((h) => h.id)).toEqual(['h2']);
    expect(result.completions.map((c) => c.id)).toEqual(['c2']);
  });
});

describe('recentCompletionMap / activeHabits', () => {
  it('son N günü eskiden yeniye döner', () => {
    const data = [completion('c1', 'h1', '2026-05-03')];
    const map = recentCompletionMap(data, 'h1', 3, '2026-05-03');
    expect(map).toEqual([false, false, true]);
  });

  it('yalnızca aktif alışkanlıkları döner', () => {
    expect(activeHabits([habit('h1'), habit('h2', false)]).map((h) => h.id)).toEqual(['h1']);
  });
});
