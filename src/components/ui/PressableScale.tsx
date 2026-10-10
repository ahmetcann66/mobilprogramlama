import React from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  readonly style?: StyleProp<ViewStyle>;
  readonly children: React.ReactNode;
  /** Basılıyken küçülme oranı. */
  readonly scaleTo?: number;
}

/**
 * Dokunmada hafif küçülen buton sarmalayıcı. Tek bir animasyonlu Pressable
 * kullanır; böylece dış bir sarıcı katmanı esneklik (flex) düzenini bozmaz,
 * verilen stil doğrudan elemana uygulanır. Reduced Motion tercihine uyar:
 * tercih açıksa ölçek animasyonu yapılmaz, yalnızca opaklık değişir.
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const reduced = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        if (!reduced) {
          // eslint-disable-next-line react-hooks/immutability -- reanimated'ın resmi shared value API'si
          scale.value = withTiming(scaleTo, { duration: duration.instant, easing: easing.standard });
        } else {
          // eslint-disable-next-line react-hooks/immutability -- reanimated'ın resmi shared value API'si
          opacity.value = withTiming(0.7, { duration: duration.instant });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // eslint-disable-next-line react-hooks/immutability -- reanimated'ın resmi shared value API'si
        scale.value = withTiming(1, { duration: duration.fast, easing: easing.enter });
        // eslint-disable-next-line react-hooks/immutability -- reanimated'ın resmi shared value API'si
        opacity.value = withTiming(1, { duration: duration.fast });
        onPressOut?.(event);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
