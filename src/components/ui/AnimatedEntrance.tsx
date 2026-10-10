import React, { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface AnimatedEntranceProps {
  readonly children: React.ReactNode;
  /** Kademeli giriş için gecikme (ms). */
  readonly delay?: number;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Ekran açıldığında içeriği hafif opacity + translateY ile gösterir.
 * Kademeli (stagger) kullanım için `delay` verilebilir. Reduced Motion
 * tercihine uyar ve yalnızca bir kez çalışır.
 */
export function AnimatedEntrance({
  children,
  delay = 0,
  style,
}: AnimatedEntranceProps): React.JSX.Element {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const config = { duration: duration.slow, easing: easing.enter };
    opacity.value = withDelay(delay, withTiming(1, config));
    translateY.value = withDelay(delay, withTiming(0, config));
  }, [delay, reduced, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
