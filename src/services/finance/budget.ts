import type { AppData, Budget, DateRange, Minor, Transaction } from '@/types';
import { ratio, sumMinor } from '@/utils/money';
import { calculateExpenses, sumByCategory } from './transactions';

/**
 * Bütçe iş mantığı.
 *
 * Bütçe aşımı durumunda veri DEĞİŞTİRİLMEZ veya işlem silinmez; yalnızca
 * durum (usage/over) hesaplanıp arayüze bildirilir.
 */

export interface BudgetUsage {
  readonly spentMinor: Minor;
  readonly totalMinor: Minor;
  readonly remainingMinor: Minor;
  /** 0..1 arası kullanım oranı (aşımda 1'e sabitlenir). */
  readonly usage: number;
  readonly overBudget: boolean;
  /** true ise kullanıcı bir bütçe tanımlamıştır. */
  readonly hasBudget: boolean;
}

export function computeBudgetUsage(
  budget: Budget,
  transactions: readonly Transaction[],
  range: DateRange | null = null,
): BudgetUsage {
  const spentMinor = calculateExpenses(transactions, range);
  const totalMinor = budget.monthlyTotalMinor;
  const hasBudget = totalMinor > 0;
  return {
    spentMinor,
    totalMinor,
    remainingMinor: totalMinor - spentMinor,
    usage: hasBudget ? ratio(spentMinor, totalMinor) : 0,
    overBudget: hasBudget && spentMinor > totalMinor,
    hasBudget,
  };
}

export interface CategoryBudgetRow {
  readonly categoryId: string;
  readonly limitMinor: Minor;
  readonly spentMinor: Minor;
  readonly usage: number;
  readonly overBudget: boolean;
}

/** Kategori bazlı bütçe satırlarını limit tanımlı kategoriler için üretir. */
export function computeCategoryBudgets(
  budget: Budget,
  transactions: readonly Transaction[],
  range: DateRange | null = null,
): CategoryBudgetRow[] {
  const spent = sumByCategory(transactions, 'expense', range);

  return Object.entries(budget.categoryLimits)
    .filter(([, limit]) => limit > 0)
    .map(([categoryId, limitMinor]) => {
      const spentMinor = spent[categoryId] ?? 0;
      return {
        categoryId,
        limitMinor,
        spentMinor,
        usage: ratio(spentMinor, limitMinor),
        overBudget: spentMinor > limitMinor,
      };
    })
    .sort((a, b) => b.usage - a.usage);
}

/**
 * Bu ay için, tanımlı listede olmayan kategorileri de kapsayan tam
 * gider dökümü. Grafiklerde kullanılır.
 */
export function monthExpenseBreakdown(
  transactions: readonly Transaction[],
  range: DateRange | null,
): Record<string, Minor> {
  return sumByCategory(transactions, 'expense', range);
}

/** AppData'dan bütçe kullanımını kolayca hesaplayan yardımcı. */
export function budgetUsageFor(
  data: AppData,
  range: DateRange | null,
): BudgetUsage {
  return computeBudgetUsage(data.budget, data.transactions, range);
}

/** Bütçe kullanım oranını yüzde olarak güvenli döndürür. */
export function budgetUsagePercent(usage: BudgetUsage): number {
  if (!usage.hasBudget) return 0;
  return Math.round(usage.usage * 100);
}

/** Toplam bütçeyi verilen gider listesinden doğrular (negatif olamaz). */
export function normalizeBudgetTotal(value: Minor): Minor {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

/** Kategori limitleri toplamı. */
export function totalCategoryLimits(budget: Budget): Minor {
  return sumMinor(Object.values(budget.categoryLimits));
}
