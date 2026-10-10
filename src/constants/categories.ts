import type { Category, CategoryKind, TransactionType } from '@/types';

/**
 * Başlangıç kategorileri. Sistem genişletilebilir olsun diye `id` alanları
 * sabit metinlerdir; yeni kategori eklemek buraya satır eklemekten ibarettir.
 */
export const DEFAULT_CATEGORIES: readonly Category[] = [
  // Gider
  { id: 'market', name: 'Market', icon: 'cart', color: '#FFB020', kind: 'expense' },
  { id: 'transport', name: 'Ulaşım', icon: 'bus', color: '#5B9CFF', kind: 'expense' },
  { id: 'food', name: 'Yemek', icon: 'utensils', color: '#FF7A59', kind: 'expense' },
  { id: 'bills', name: 'Faturalar', icon: 'receipt', color: '#A78BFA', kind: 'expense' },
  { id: 'education', name: 'Eğitim', icon: 'book', color: '#34D399', kind: 'expense' },
  { id: 'health', name: 'Sağlık', icon: 'heart', color: '#F472B6', kind: 'expense' },
  { id: 'entertainment', name: 'Eğlence', icon: 'film', color: '#FB923C', kind: 'expense' },
  { id: 'shopping', name: 'Alışveriş', icon: 'shoppingBag', color: '#38BDF8', kind: 'expense' },
  { id: 'credit', name: 'Borç / Kredi', icon: 'receipt', color: '#E879F9', kind: 'expense' },
  { id: 'other', name: 'Diğer', icon: 'other', color: '#94A3B8', kind: 'both' },

  // Gelir
  { id: 'salary', name: 'Maaş', icon: 'wallet', color: '#22DB95', kind: 'income' },
  { id: 'extra', name: 'Ek gelir', icon: 'trendingUp', color: '#2DD4CF', kind: 'income' },
  { id: 'gift', name: 'Burs / Hediye', icon: 'gift', color: '#60A5FA', kind: 'income' },
] as const;

const CATEGORY_MAP: ReadonlyMap<string, Category> = new Map(
  DEFAULT_CATEGORIES.map((category) => [category.id, category]),
);

/** Bilinmeyen kategori kimliği için güvenli varsayılan. */
export const FALLBACK_CATEGORY: Category = {
  id: 'other',
  name: 'Diğer',
  icon: 'other',
  color: '#94A3B8',
  kind: 'both',
};

/** Kimliğe göre kategori döndürür; bulunamazsa `undefined`. */
export function findCategory(id: string): Category | undefined {
  return CATEGORY_MAP.get(id);
}

/** Kimliğe göre kategori döndürür; bulunamazsa varsayılana düşer. */
export function getCategoryOrDefault(id: string): Category {
  return CATEGORY_MAP.get(id) ?? FALLBACK_CATEGORY;
}

/** Belirli bir işlem türü altında seçilebilecek kategoriler. */
export function categoriesForType(type: TransactionType): readonly Category[] {
  return DEFAULT_CATEGORIES.filter((category) => category.kind === type || category.kind === 'both');
}

/** Tür filtresi: `both` kategoriler hem gelir hem gider için geçerlidir. */
export function categoryMatchesType(kind: CategoryKind, type: TransactionType): boolean {
  return kind === 'both' || kind === type;
}
