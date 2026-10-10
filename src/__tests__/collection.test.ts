import { collectValid } from '@/utils/collection';

interface Row {
  readonly id: string;
  readonly n: number;
}

function parseRow(value: unknown): Row | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.n !== 'number') return null;
  return { id: record.id, n: record.n };
}

describe('collectValid', () => {
  it('geçerli kayıtları döner, geçersizleri ayıklar', () => {
    const raw: unknown[] = [
      { id: 'a', n: 1 },
      null,
      { id: 'b' },
      'hata',
      42,
      { id: 'c', n: 3 },
    ];
    expect(collectValid(raw, parseRow)).toEqual([
      { id: 'a', n: 1 },
      { id: 'c', n: 3 },
    ]);
  });

  it('boş girdide boş dizi döner', () => {
    expect(collectValid([], parseRow)).toEqual([]);
  });

  it('tip parametresini ayrıştırıcının dönüş tipinden çıkarır (inference)', () => {
    const parsed = collectValid<Row>([{ id: 'x', n: 5 }, 'atılacak'], (value) => {
      if (typeof value !== 'object' || value === null) return null;
      const record = value as Record<string, unknown>;
      if (typeof record.id !== 'string' || typeof record.n !== 'number') return null;
      return { id: record.id, n: record.n };
    });
    expect(parsed).toEqual([{ id: 'x', n: 5 }]);
  });

  it('null dönen ayrıştırıcıya karşı yayılmaz (null dışı korunur)', () => {
    const values: unknown[] = [0, false, '', []];
    const parsed = collectValid(values, (value) => (typeof value === 'number' ? value : null));
    expect(parsed).toEqual([0]);

    const parsedStr = collectValid(values, (value) => (typeof value === 'string' ? value : null));
    expect(parsedStr).toEqual(['']);
  });
});