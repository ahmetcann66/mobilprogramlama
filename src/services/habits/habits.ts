import type { DateKey, Habit, HabitCompletion } from '@/types';
import { addDays, daysBetween, startOfWeek, toDateKey, todayKey } from '@/utils/date';
import { safePercent } from '@/utils/validation';

/**
 * Alışkanlık iş mantığı — saf fonksiyonlar.
 *
 * Önemli kural: bir alışkanlık aynı GÜN için yalnızca bir kez tamamlanmış
 * sayılır. (habitId, date) çifti tekildir; bu sayede seri (streak) ve
 * tamamlanma yüzdeleri gerçek kayıtlardan tutarlı hesaplanır.
 */

/** Belirli bir günde alışkanlığın tamamlanıp tamamlanmadığını kontrol eder. */
export function isCompletedOn(
  completions: readonly HabitCompletion[],
  habitId: string,
  date: DateKey,
): boolean {
  return completions.some((c) => c.habitId === habitId && c.date === date);
}

/**
 * Tamamlanma durumunu değiştirir (toggle). Aynı gün iki kez eklenemez;
 * zaten varsa kaldırılır.
 */
export function toggleCompletion(
  completions: readonly HabitCompletion[],
  habitId: string,
  date: DateKey,
  newId: string,
  completedAt: string,
): HabitCompletion[] {
  const exists = completions.some((c) => c.habitId === habitId && c.date === date);
  if (exists) {
    return completions.filter((c) => !(c.habitId === habitId && c.date === date));
  }
  return [...completions, { id: newId, habitId, date, completedAt }];
}

/**
 * Serie (streak) hesabı: referans günden geriye doğru kesintisiz
 * tamamlanan gün sayısı.
 *
 * Bugün henüz tamamlanmadıysa seri bozulmaz; dünkü seriden devam edilir.
 * Bu, kullanıcıyı gün bitmeden "seri kaybettim" hissinden korur. Eksik
 * günler asla başarı sayılmaz.
 */
export function calculateHabitStreak(
  completions: readonly HabitCompletion[],
  habitId: string,
  reference: DateKey = todayKey(),
): number {
  const days = new Set(
    completions.filter((c) => c.habitId === habitId).map((c) => c.date),
  );

  let cursor = days.has(reference) ? reference : addDays(reference, -1);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Belirli bir günde aktif alışkanlıkların tamamlanma yüzdesi. */
export function dailyCompletionPercent(
  habits: readonly Habit[],
  completions: readonly HabitCompletion[],
  date: DateKey,
): number {
  const active = habits.filter((h) => h.active);
  if (active.length === 0) return 0; // sıfıra bölme koruması
  const done = active.filter((h) => isCompletedOn(completions, h.id, date)).length;
  return safePercent(done, active.length);
}

/** Hafta içinde tamamlanan benzersiz alışkanlık-gün sayısı. */
export function weekCompletedCount(
  habits: readonly Habit[],
  completions: readonly HabitCompletion[],
  weekStartsOn: 0 | 1 = 1,
  reference: DateKey = todayKey(),
): number {
  const start = toDateKey(startOfWeek(new Date(`${reference}T00:00:00`), weekStartsOn));
  const activeIds = new Set(habits.filter((h) => h.active).map((h) => h.id));
  return completions.filter(
    (c) => activeIds.has(c.habitId) && c.date >= start && c.date <= reference,
  ).length;
}

export interface WeeklyProgress {
  readonly completed: number;
  readonly total: number;
  readonly percent: number;
}

/** Aktif alışkanlıklar için haftalık tamamlanma ilerlemesi. */
export function weeklyProgress(
  habits: readonly Habit[],
  completions: readonly HabitCompletion[],
  weekStartsOn: 0 | 1 = 1,
  reference: DateKey = todayKey(),
): WeeklyProgress {
  const active = habits.filter((h) => h.active);
  const start = toDateKey(startOfWeek(new Date(`${reference}T00:00:00`), weekStartsOn));
  const elapsed = Math.min(7, Math.max(1, daysBetween(start, reference) + 1));
  const total = active.length * elapsed;
  const completed = weekCompletedCount(habits, completions, weekStartsOn, reference);
  return { completed, total, percent: safePercent(completed, total) };
}

/** Yeni alışkanlık ekler. */
export function addHabit(habits: readonly Habit[], habit: Habit): Habit[] {
  return [habit, ...habits];
}

/** Alışkanlığı günceller. */
export function updateHabit(
  habits: readonly Habit[],
  id: string,
  patch: Partial<Omit<Habit, 'id' | 'createdAt'>>,
): Habit[] {
  return habits.map((h) => (h.id === id ? { ...h, ...patch, id: h.id } : h));
}

/**
 * Alışkanlığı ve ona ait tüm tamamlanma kayıtlarını siler.
 * Yetim (orphan) kayıt bırakmamak için iki dizi birlikte güncellenir.
 */
export function deleteHabit(
  habits: readonly Habit[],
  completions: readonly HabitCompletion[],
  id: string,
): { habits: Habit[]; completions: HabitCompletion[] } {
  return {
    habits: habits.filter((h) => h.id !== id),
    completions: completions.filter((c) => c.habitId !== id),
  };
}

/** Bir alışkanlığın son N gündeki tamamlanma haritası (takvim için). */
export function recentCompletionMap(
  completions: readonly HabitCompletion[],
  habitId: string,
  days: number,
  reference: DateKey = todayKey(),
): boolean[] {
  const result: boolean[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = addDays(reference, -i);
    result.push(isCompletedOn(completions, habitId, key));
  }
  return result;
}

/** Belirtilen tarihteki aktif alışkanlıkların listesi. */
export function activeHabits(habits: readonly Habit[]): Habit[] {
  return habits.filter((h) => h.active);
}
