import { Easing } from 'react-native-reanimated';

/**
 * Hareket (motion) sistemi. Animasyon süreleri ve eğrileri tek yerden
 * yönetilir. Süreler kullanıcı deneyimini yavaşlatmayacak kadar kısa,
 * fark edilecek kadar uzundur.
 */
export const duration = {
  instant: 90,
  fast: 160,
  base: 240,
  slow: 380,
  slower: 520,
} as const;

export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  enter: Easing.out(Easing.cubic),
  exit: Easing.in(Easing.cubic),
  spring: Easing.bezier(0.34, 1.3, 0.64, 1),
} as const;

/** Kademeli giriş (stagger) aralığı. */
export const stagger = 55;
