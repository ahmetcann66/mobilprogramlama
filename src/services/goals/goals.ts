import type { Minor, SavingsContribution, SavingsGoal } from '@/types';
import { ratio, sumMinor } from '@/utils/money';

/**
 * Tasarruf hedefi iş mantığı — saf fonksiyonlar.
 *
 * MUHASEBE NOTU: Bir hedefe yapılan katkı (contribution) genel finans
 * gideri DEĞİLDİR. Para yok olmaz, bir hesaptan birikime aktarılır. Bu
 * yüzden katkılar gider toplamlarına eklenmez. Çift sayımı önlemek için
 * birikim = başlangıç + katkılar formülü tek yerde (goalSavedMinor)
 * hesaplanır.
 */

/** Hedefte biriken toplam tutar: başlangıç birikimi + tüm katkılar. */
export function goalSavedMinor(
  goal: SavingsGoal,
  contributions: readonly SavingsContribution[],
): Minor {
  const extra = contributions
    .filter((contribution) => contribution.goalId === goal.id)
    .map((contribution) => contribution.amountMinor);
  return goal.initialMinor + sumMinor(extra);
}

/** Hedefe ait katkılar, en yeniden eskiye. */
export function contributionsFor(
  contributions: readonly SavingsContribution[],
  goalId: string,
): SavingsContribution[] {
  return contributions
    .filter((contribution) => contribution.goalId === goalId)
    .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1));
}

export interface GoalProgress {
  readonly savedMinor: Minor;
  readonly targetMinor: Minor;
  readonly remainingMinor: Minor;
  /** 0..1 arası; hedef aşımında 1'e sabitlenir. */
  readonly ratio: number;
  readonly percent: number;
  readonly reached: boolean;
  /** Hedef aşıldıysa aşım miktarı (kuruş). */
  readonly overflowMinor: Minor;
}

/** Hedef ilerlemesini hesaplar. Hedef tutarı 0/negatifse güvenli değer döner. */
export function computeGoalProgress(
  goal: SavingsGoal,
  contributions: readonly SavingsContribution[],
): GoalProgress {
  const savedMinor = goalSavedMinor(goal, contributions);
  const targetMinor = goal.targetMinor;
  const valid = Number.isFinite(targetMinor) && targetMinor > 0;
  const reached = valid && savedMinor >= targetMinor;

  return {
    savedMinor,
    targetMinor,
    remainingMinor: valid ? Math.max(0, targetMinor - savedMinor) : 0,
    ratio: valid ? ratio(savedMinor, targetMinor) : 0,
    percent: valid ? Math.round(ratio(savedMinor, targetMinor) * 100) : 0,
    reached,
    overflowMinor: valid ? Math.max(0, savedMinor - targetMinor) : 0,
  };
}

/** Yeni katkı ekler. */
export function addContribution(
  contributions: readonly SavingsContribution[],
  contribution: SavingsContribution,
): SavingsContribution[] {
  return [contribution, ...contributions];
}

/** Katkıyı siler. */
export function removeContribution(
  contributions: readonly SavingsContribution[],
  id: string,
): SavingsContribution[] {
  return contributions.filter((contribution) => contribution.id !== id);
}

export interface GoalSummary {
  readonly activeCount: number;
  readonly targetTotalMinor: Minor;
  readonly savedTotalMinor: Minor;
  readonly remainingTotalMinor: Minor;
}

/** Aktif hedeflerin toplu özeti (dashboard ve insights için). */
export function summarizeGoals(
  goals: readonly SavingsGoal[],
  contributions: readonly SavingsContribution[],
): GoalSummary {
  const active = goals.filter((goal) => goal.status === 'active');
  const targetTotalMinor = sumMinor(active.map((goal) => goal.targetMinor));
  const savedTotalMinor = sumMinor(
    active.map((goal) => goalSavedMinor(goal, contributions)),
  );
  return {
    activeCount: active.length,
    targetTotalMinor,
    savedTotalMinor,
    remainingTotalMinor: Math.max(0, targetTotalMinor - savedTotalMinor),
  };
}

/** Hedef durumunu ilerleme ve elle arşivleme durumuna göre türetir. */
export function resolveGoalStatus(goal: SavingsGoal, progress: GoalProgress): SavingsGoal['status'] {
  if (goal.status === 'archived') return 'archived';
  if (progress.reached) return 'completed';
  return 'active';
}

// --- Kumbara (otomatik bozuk para birikimi) ----------------------------

/**
 * Bir giderin "bozuk parasını" hesaplar: tutarı en yakın 1 TL'ye tamamlayan
 * fark. Örn. 1.250 kuruş → 50 kuruş, 1.300 kuruş → 0 kuruş.
 * `transactionId` ile işleme bağlanarak silme işlemi geri alınabilir.
 */
export function roundUpMinor(amountMinor: Minor): Minor {
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) return 0;
  const remainder = Math.round(amountMinor) % 100;
  return remainder === 0 ? 0 : 100 - remainder;
}

/** Kumbara aktif olan ilk aktif hedefi döndürür (yoksa undefined). */
export function piggyBankGoal(goals: readonly SavingsGoal[]): SavingsGoal | undefined {
  return goals.find((goal) => goal.status === 'active' && goal.roundUpEnabled === true);
}
