import {
  addDays,
  daysBetween,
  formatMonthYearTR,
  formatWeekdayTR,
  parseDateInput,
  parseDateKey,
  rangeForPreset,
  toDateKey,
} from '@/utils/date';

describe('toDateKey / parseDateKey', () => {
  it('yerel tarihi YYYY-MM-DD biçimine çevirir', () => {
    expect(toDateKey(new Date(2026, 4, 1))).toBe('2026-05-01');
  });

  it('gün ve ayı iki basamağa tamamlar', () => {
    expect(toDateKey(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('anahtarı yerel Date nesnesine çevirir (saat 00:00)', () => {
    const date = parseDateKey('2026-05-01');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(1);
  });
});

describe('addDays', () => {
  it('ay sınırını doğru geçer', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('geriye doğru gider', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('daysBetween', () => {
  it('iki gün arasındaki farkı döner', () => {
    expect(daysBetween('2026-05-01', '2026-05-10')).toBe(9);
  });

  it('aynı gün için sıfır döner', () => {
    expect(daysBetween('2026-05-01', '2026-05-01')).toBe(0);
  });
});

describe('parseDateInput', () => {
  it('GG.AA.YYYY biçimini ayrıştırır', () => {
    expect(parseDateInput('01.05.2026')).toBe('2026-05-01');
  });

  it('ISO biçimini ayrıştırır', () => {
    expect(parseDateInput('2026-05-01')).toBe('2026-05-01');
  });

  it('geçersiz günü reddeder', () => {
    expect(parseDateInput('32.01.2026')).toBeNull();
  });

  it('rastgele metni reddeder', () => {
    expect(parseDateInput('yarın')).toBeNull();
  });
});

describe('rangeForPreset', () => {
  it('bu ayı ilk/son güne sabitler', () => {
    expect(rangeForPreset('thisMonth', new Date(2026, 4, 15))).toEqual({
      from: '2026-05-01',
      to: '2026-05-31',
    });
  });

  it('geçen ayı doğru hesaplar', () => {
    expect(rangeForPreset('lastMonth', new Date(2026, 4, 15))).toEqual({
      from: '2026-04-01',
      to: '2026-04-30',
    });
  });

  it('tümü için null döner', () => {
    expect(rangeForPreset('all', new Date(2026, 4, 15))).toBeNull();
  });
});

describe('formatlayıcılar', () => {
  it('ay/yıl Türkçe gösterir', () => {
    expect(formatMonthYearTR('2026-05-01')).toBe('Mayıs 2026');
  });

  it('hafta gününü kısaltmalı gösterir', () => {
    // 2026-05-01 Cuma
    expect(formatWeekdayTR('2026-05-01')).toBe('Cum');
  });
});
