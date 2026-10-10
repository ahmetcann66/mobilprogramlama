/**
 * Jenerik koleksiyon yardımcıları.
 *
 * Fonksiyonlar bir `T` tip parametresi alır; böylece işlem, alışkanlık,
 * hedef gibi farklı türler için aynı mantık tek noktada, tip güvenli
 * biçimde yeniden kullanılır.
 */

/**
 * Ham değer dizisini bir ayrıştırıcıdan geçirir; geçersiz kayıtları
 * (`null` dönenleri) ayıklayıp yalnızca geçerli öğeleri `T[]` olarak döner.
 *
 * @param items  Tehlikeli/doğrulanmamış kaynak (ör. depodan gelen JSON dizi).
 * @param parse  Tek bir değeri `T`'ye çeviren tip yüklemi; başarısızsa `null`.
 */
export function collectValid<T>(
  items: readonly unknown[],
  parse: (value: unknown) => T | null,
): T[] {
  const result: T[] = [];
  for (const item of items) {
    const parsed = parse(item);
    if (parsed !== null) {
      result.push(parsed);
    }
  }
  return result;
}