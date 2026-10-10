import { parseAmountInput, safePercent, validateName, validateRequired } from '@/utils/validation';

describe('parseAmountInput', () => {
  it('geçerli tutarı kuruşa çevirir', () => {
    const result = parseAmountInput('12,50');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.minor).toBe(1250);
  });

  it('boş girdide hata döner', () => {
    const result = parseAmountInput('   ');
    expect(result.ok).toBe(false);
  });

  it('sıfır tutarı reddeder', () => {
    const result = parseAmountInput('0');
    expect(result.ok).toBe(false);
  });

  it('geçersiz metinde hata döner', () => {
    const result = parseAmountInput('abc');
    expect(result.ok).toBe(false);
  });
});

describe('validateRequired', () => {
  it('boşta etiketli hata döner', () => {
    expect(validateRequired('', 'Ad')).toBe('Ad gerekli');
  });

  it('doluda null döner', () => {
    expect(validateRequired('test', 'Ad')).toBeNull();
  });
});

describe('validateName', () => {
  it('maksimum uzunluğu aşan ismi reddeder', () => {
    expect(validateName('a'.repeat(41), 'Ad', 40)).not.toBeNull();
  });

  it('sınırda geçerli ismi kabul eder', () => {
    expect(validateName('a'.repeat(40), 'Ad', 40)).toBeNull();
  });
});

describe('safePercent', () => {
  it('yüzdeyi yuvarlar', () => {
    expect(safePercent(1, 3)).toBe(33);
  });

  it('sıfıra bölmede 0 döner', () => {
    expect(safePercent(5, 0)).toBe(0);
  });

  it('geçersiz sayılarda 0 döner', () => {
    expect(safePercent(Number.NaN, 10)).toBe(0);
  });
});
