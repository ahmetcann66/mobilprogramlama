import { deepEqual } from '@/utils/equality';

describe('deepEqual', () => {
  describe('ilkeller', () => {
    it('eşit ve eşit olmayan sayıları ayırt eder', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual(1, '1')).toBe(false);
    });

    it('NaN eşitliğini korur (Object.is)', () => {
      expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
    });

    it('metin ve booleanları karşılaştırır', () => {
      expect(deepEqual('haber', 'haber')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(true, false)).toBe(false);
    });
  });

  describe('null / undefined / kayan değerler', () => {
    it('null ve undefined kendi aralarında eşittir', () => {
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('null ile undefined eşit değildir', () => {
      expect(deepEqual(null, undefined)).toBe(false);
    });

    it('Object.is semantiği: -0 ile +0 farklı, 0 ile false farklıdır', () => {
      expect(deepEqual(-0, 0)).toBe(false);
      expect(deepEqual(0, false)).toBe(false);
    });
  });

  describe('diziler', () => {
    it('içerik ve sıra duyarlıdır', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2], [2, 1])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 2])).toBe(false);
    });

    it('referans farklı ama içerik aynı diziler eşittir', () => {
      const a = [1, { x: 2 }];
      const b = [1, { x: 2 }];
      expect(a).not.toBe(b);
      expect(deepEqual(a, b)).toBe(true);
    });
  });

  describe('nesneler', () => {
    it('anahtar sırası önemsizdir', () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it('iç içe nesne ve dizileri karşılaştırır', () => {
      const a = { a: { b: [1, 2] }, c: 'x' };
      const b = { a: { b: [1, 2] }, c: 'x' };
      expect(deepEqual(a, b)).toBe(true);
      expect(deepEqual(a, { ...b, a: { b: [1, 3] } })).toBe(false);
    });

    it('eksik/fazla anahtarı fark eder', () => {
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('undefined değerli anahtarları da dikkate alır', () => {
      expect(deepEqual({ a: undefined }, { b: undefined })).toBe(false);
      expect(deepEqual({ a: undefined }, {})).toBe(false);
    });
  });

  describe('tarih ve farklı prototipler', () => {
    it('tarihleri zaman damgasına göre karşılaştırır', () => {
      expect(deepEqual(new Date('2026-01-01'), new Date('2026-01-01'))).toBe(true);
      expect(deepEqual(new Date('2026-01-01'), new Date('2026-01-02'))).toBe(false);
    });

    it('tarih ile yalın nesne eşit değildir', () => {
      expect(deepEqual(new Date(), {})).toBe(false);
    });

    it('Map/Set gibi özel nesnelerde içeriğe inecek şekilde davranmaz', () => {
      expect(deepEqual(new Map(), new Map())).toBe(false);
    });
  });
});