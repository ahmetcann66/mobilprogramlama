export { colors, palette, amountColor } from './colors';
export type { AppColors, AmountTone } from './colors';
export { spacing, radius, hitSlop } from './spacing';
export { typography, fonts, tabularNums } from './typography';
export type { TypographyVariant } from './typography';
export { shadows } from './shadows';
export { duration, easing, stagger } from './motion';

/** İkon boyutları: küçük/orta/büyük bağlamlar için tutarlı ölçek. */
export const iconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 36,
} as const;
