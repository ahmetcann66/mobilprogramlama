/**
 * Değer eşitliği yardımcıları.
 *
 * Referans karşılaştırması (`===`) yalnızca bellekteki adresi kontrol eder;
 * içerik aynı olsa bile yeni üretilen nesneler için yanlış döner. Bu
 * kütüphane, "iki form değeri değişmedi mi?" gibi soruları içerik üzerinden
 * yanıtlar.
 */

/** Yalın nesne mi (Map, Date, sınıf örneği değil)? */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * İki değeri derinlemesine karşılaştırır.
 *
 * - İlkellerde `Object.is` kullanılır; böylece `NaN` eşitliği de korunur.
 * - Tarih nesneleri zaman damgasına göre, diziler sıra duyarlı biçimde ele alınır.
 * - Yalın nesnelerde anahtar kümesi ve anahtar başına değer karşılaştırılır
 *   (anahtar sırası önemsizdir).
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}