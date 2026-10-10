import {
  MINOR_PER_UNIT,
  formatMinor,
  formatMinorPlain,
  parseAmountToMinor,
  ratio,
  sumMinor,
} from '@/utils/money';

describe('parseAmountToMinor', () => {
  it('Türkçe ondalık virgülü kuruşa çevirir', () => {
    expect(parseAmountToMinor('12,50')).toBe(1250);
  });

  it('nokta ondalığını kabul eder', () => {
    expect(parseAmountToMinor('12.50')).toBe(1250);
  });

  it('tam sayı tutarı ölçekler', () => {
    expect(parseAmountToMinor('100')).toBe(100 * MINOR_PER_UNIT);
  });

  it('binlik ayraçlarını tolere eder (TR biçimi)', () => {
    expect(parseAmountToMinor('1.234,56')).toBe(123456);
  });

  it('binlik ayraçlarını tolere eder (EN biçimi)', () => {
    expect(parseAmountToMinor('1,234.56')).toBe(123456);
  });

  it('tek haneli ondalığı kabul eder', () => {
    expect(parseAmountToMinor('5,5')).toBe(550);
  });

  it('para birimi sembolü ve boşlukları yok sayar', () => {
    expect(parseAmountToMinor('₺ 42,00')).toBe(4200);
  });

  it('boş, geçersiz ve negatif girdilerde null döner', () => {
    expect(parseAmountToMinor('')).toBeNull();
    expect(parseAmountToMinor('abc')).toBeNull();
    expect(parseAmountToMinor('-5')).toBeNull();
    expect(parseAmountToMinor('12,345,6')).toBeNull();
  });

  it('kesirli sonuçları tam kuruşa yuvarlar', () => {
    expect(parseAmountToMinor('0,01')).toBe(1);
  });
});

describe('formatMinorPlain', () => {
  it('kuruşu Türkçe biçimde gösterir', () => {
    expect(formatMinorPlain(123456)).toBe('1.234,56');
  });

  it('kuruş basamağını sıfırla doldurur', () => {
    expect(formatMinorPlain(1250)).toBe('12,50');
  });

  it('negatif değerleri işaretle gösterir', () => {
    expect(formatMinorPlain(-1250)).toBe('-12,50');
  });

  it('sıfırı gösterir', () => {
    expect(formatMinorPlain(0)).toBe('0,00');
  });
});

describe('formatMinor', () => {
  it('TRY için tutarı ve ondalığı içerir', () => {
    const result = formatMinor(1250, 'TRY');
    expect(result).toContain('12');
    expect(result).toContain('50');
  });
});

describe('sumMinor', () => {
  it('tam sayı hassasiyetiyle toplar', () => {
    expect(sumMinor([1, 2, 3])).toBe(6);
  });

  it('her elemanı yuvarlayarak toplar', () => {
    expect(sumMinor([0.4, 0.6])).toBe(1);
  });

  it('NaN ve Infinity değerleri yok sayar', () => {
    expect(sumMinor([10, Number.NaN, Number.POSITIVE_INFINITY, 5])).toBe(15);
  });

  it('boş liste için sıfır döner', () => {
    expect(sumMinor([])).toBe(0);
  });
});

describe('ratio', () => {
  it('normal oranı hesaplar', () => {
    expect(ratio(50, 100)).toBe(0.5);
  });

  it('1 üzerini 1e kırpar', () => {
    expect(ratio(200, 100)).toBe(1);
  });

  it('negatifi 0a kırpar', () => {
    expect(ratio(-10, 100)).toBe(0);
  });

  it('sıfır/negatif böleni güvenli karşılar', () => {
    expect(ratio(10, 0)).toBe(0);
    expect(ratio(10, -5)).toBe(0);
  });
});
