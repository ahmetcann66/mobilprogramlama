import type { HabitCategory } from '@/types';

export interface HabitCategoryMeta {
  readonly label: string;
  readonly color: string;
}

/** Alışkanlık kategorilerinin görünen adları ve renkleri. */
export const HABIT_CATEGORY_META: Record<HabitCategory, HabitCategoryMeta> = {
  finance: { label: 'Finans', color: '#22DB95' },
  productivity: { label: 'Üretkenlik', color: '#5B9CFF' },
  learning: { label: 'Öğrenme', color: '#A78BFA' },
  health: { label: 'Sağlık', color: '#F472B6' },
  mindfulness: { label: 'Zihin', color: '#2DD4CF' },
  custom: { label: 'Diğer', color: '#94A3B8' },
};

export const HABIT_CATEGORIES: readonly HabitCategory[] = [
  'finance',
  'productivity',
  'learning',
  'health',
  'mindfulness',
  'custom',
];
