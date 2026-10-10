/**
 * Benzersiz kimlik üretimi.
 *
 * Zaman damgası + rastgele taban-36 parça birleştirilir. Aynı milisaniyede
 * ardışık üretimlerde bile çakışma olasılığı pratikte sıfırdır. Harici
 * kriptografi bağımlılığı gerektirmez.
 */
export function createId(prefix = 'id'): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}_${random}`;
}
