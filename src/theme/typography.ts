import type { TextStyle } from 'react-native';

/**
 * Tipografi sistemi.
 *
 * Inter font ailesi yüklenir (bkz. app/_layout.tsx). Her stil metin
 * boyutu, satır yüksekliği ve ağırlığı birlikte tanımlar; böylece
 * başlık/alt başlık/etiket hiyerarşisi tüm ekranlarda aynıdır.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

type Variant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'micro';

export const typography: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.bold, fontSize: 38, lineHeight: 44, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.semibold, fontSize: 21, lineHeight: 27, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  title: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  micro: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
};

/**
 * Para tutarları için eşit genişlikli (tabular) rakam stili.
 * Karşılaştırılabilir sütunlar oluşturmak için hizalı rakamlar kullanılır.
 */
export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

export type TypographyVariant = Variant;
