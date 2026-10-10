import type { ViewStyle } from 'react-native';

/**
 * Gölge sistemi. Koyu temada gölgeler düşük opaklıkta tutulur; derinlik
 * ağırlıklı olarak yüzey renkleriyle sağlanır. Android için `elevation`,
 * iOS için klasik gölge özellikleri kullanılır.
 */
export const shadows: Record<'none' | 'soft' | 'card' | 'floating', ViewStyle> = {
  none: {},
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  card: {
    shadowColor: '#02060D',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  floating: {
    shadowColor: '#0A1A12',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
};
