/**
 * Merkezi renk paleti ve anlamsal (semantic) renk tokenları.
 *
 * Buradaki değerler uygulamanın her yerinden import edilir; hiçbir bileşen
 * kendi rengini elle tanımlamaz. Böylece tema tutarlı kalır ve ileride
 * açık tema eklemek gibi değişiklikler tek noktadan yönetilebilir.
 */
export const palette = {
  // Zemin katmanları (koyu tema)
  bg: '#0A0E17',
  bgElevated: '#0E1420',
  surface: '#141C2C',
  surfaceAlt: '#1A2437',
  surfaceHighlight: '#212D44',

  // Çizgiler
  border: '#232F45',
  borderStrong: '#33415C',

  // Vurgu renkleri
  primary: '#1FD98C',
  primaryDark: '#12B076',
  secondary: '#2DD4CF',

  // Metin
  text: '#F3F7FC',
  textSecondary: '#9EABC4',
  textMuted: '#66738C',
  textInverse: '#08121C',

  // Durum renkleri
  income: '#22DB95',
  expense: '#FF6B5E',
  warning: '#F5A524',
  danger: '#FF5C5C',
  info: '#5B9CFF',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/** Değişken (state) renkleri: anlamı renkle birlikte ikon ve metin de taşır. */
export const colors = {
  ...palette,
  // Yarı saydam vurgu zeminleri (chip, badge zeminleri için)
  primarySoft: 'rgba(31, 217, 140, 0.14)',
  secondarySoft: 'rgba(45, 212, 207, 0.14)',
  expenseSoft: 'rgba(255, 107, 94, 0.14)',
  incomeSoft: 'rgba(34, 219, 149, 0.14)',
  warningSoft: 'rgba(245, 165, 36, 0.14)',
  dangerSoft: 'rgba(255, 92, 92, 0.14)',
  infoSoft: 'rgba(91, 156, 255, 0.14)',
  overlay: 'rgba(5, 8, 14, 0.72)',
} as const;

/** İşlem tipine göre anlamsal renk döndürür (kontrol akışı + union type). */
export type AmountTone = 'income' | 'expense' | 'neutral';

export function amountColor(tone: AmountTone): string {
  switch (tone) {
    case 'income':
      return colors.income;
    case 'expense':
      return colors.expense;
    case 'neutral':
      return colors.text;
  }
}

export type AppColors = typeof colors;
