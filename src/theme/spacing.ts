/** Aralık (spacing) ölçeği: 4 tabanlı ızgara. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/** Köşe yarıçapları. */
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Dokunma hedefi minimum boyutu (erişilebilirlik). */
export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export type Spacing = typeof spacing;
