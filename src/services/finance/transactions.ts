import type { DateRange, Minor, Transaction, TransactionFilter, TransactionType } from '@/types';
import { sumMinor } from '@/utils/money';

/**
 * İşlem (transaction) iş mantığı — tamamen saf fonksiyonlar.
 *
 * Bu katman React'ten bağımsızdır ve bu sayede arayüz olmadan test
 * edilebilir. Tüm fonksiyonlar girdi dizisini değiştirmez (immutable);
 * yeni dizi/kopya döndürür.
 */

/** Bir işlemin tarih aralığında olup olmadığını kontrol eder (sınırlar dahil). */
export function isWithinRange(date: string, range: DateRange | null): boolean {
  if (range === null) return true;
  // 'YYYY-MM-DD' biçimi sözlük sırasıyla da doğru karşılaştırılır.
  return date >= range.from && date <= range.to;
}

/** Verilen aralıkta tür bazında toplamı hesaplar. */
export function sumByType(
  transactions: readonly Transaction[],
  type: TransactionType,
  range: DateRange | null = null,
): Minor {
  const amounts = transactions
    .filter((tx) => tx.type === type && isWithinRange(tx.date, range))
    .map((tx) => tx.amount);
  return sumMinor(amounts);
}

export function calculateIncome(
  transactions: readonly Transaction[],
  range: DateRange | null = null,
): Minor {
  return sumByType(transactions, 'income', range);
}

export function calculateExpenses(
  transactions: readonly Transaction[],
  range: DateRange | null = null,
): Minor {
  return sumByType(transactions, 'expense', range);
}

/** Net fark = gelir - gider (negatif olabilir). */
export function calculateNet(
  transactions: readonly Transaction[],
  range: DateRange | null = null,
): Minor {
  return calculateIncome(transactions, range) - calculateExpenses(transactions, range);
}

/** Tarihe göre yeniden eskiye sıralar (aynı tarihte createdAt belirleyicidir). */
export function sortByDateDesc(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

/** Tür + kategori + arama + tarih aralığı filtrelerini birlikte uygular. */
export function filterTransactions(
  transactions: readonly Transaction[],
  filter: TransactionFilter,
): Transaction[] {
  const needle = filter.search.trim().toLocaleLowerCase('tr');

  return transactions.filter((tx) => {
    if (filter.type !== 'all' && tx.type !== filter.type) return false;
    if (filter.categoryId !== 'all' && tx.categoryId !== filter.categoryId) return false;
    if (!isWithinRange(tx.date, filter.range)) return false;
    if (needle !== '') {
      const haystack = `${tx.note ?? ''}`.toLocaleLowerCase('tr');
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/** Yeni işlem ekler. */
export function addTransaction(
  transactions: readonly Transaction[],
  transaction: Transaction,
): Transaction[] {
  return [transaction, ...transactions];
}

/** Kimliğe göre işlemi günceller; bulunamazsa diziyi değiştirmeden döndürür. */
export function updateTransaction(
  transactions: readonly Transaction[],
  id: string,
  patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
): Transaction[] {
  return transactions.map((tx) => (tx.id === id ? { ...tx, ...patch, id: tx.id } : tx));
}

/** İşlemi siler. */
export function deleteTransaction(
  transactions: readonly Transaction[],
  id: string,
): Transaction[] {
  return transactions.filter((tx) => tx.id !== id);
}

/** Kategori bazında gider/gelir toplamlarını döndürür. */
export function sumByCategory(
  transactions: readonly Transaction[],
  type: TransactionType,
  range: DateRange | null = null,
): Record<string, Minor> {
  return transactions
    .filter((tx) => tx.type === type && isWithinRange(tx.date, range))
    .reduce<Record<string, Minor>>((acc, tx) => {
      const current = acc[tx.categoryId] ?? 0;
      acc[tx.categoryId] = current + tx.amount;
      return acc;
    }, {});
}

/** 'YYYY-MM' ay anahtarına göre gelir/gider toplamlarını gruplar. */
export function groupByMonth(
  transactions: readonly Transaction[],
): Record<string, { income: Minor; expense: Minor }> {
  return transactions.reduce<Record<string, { income: Minor; expense: Minor }>>((acc, tx) => {
    const key = tx.date.slice(0, 7);
    const bucket = acc[key] ?? { income: 0, expense: 0 };
    if (tx.type === 'income') bucket.income += tx.amount;
    else bucket.expense += tx.amount;
    acc[key] = bucket;
    return acc;
  }, {});
}
