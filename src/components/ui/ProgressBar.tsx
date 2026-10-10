import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, duration, easing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ProgressBarProps {
  /** 0..1 arası ilerleme oranı. */
  readonly progress: number;
  readonly color?: string;
  readonly trackColor?: string;
  readonly height?: number;
  readonly style?: StyleProp<ViewStyle>;
}

/** Yumuşak geçişli ilerleme çubuğu. Oran 0..1 aralığına sıkıştırılır. */
export function ProgressBar({
  progress,
  color = colors.primary,
  trackColor = colors.surfaceHighlight,
  height = 8,
  style,
}: ProgressBarProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const value = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    value.value = reduced
      ? clamped
      : withTiming(clamped, { duration: duration.slow, easing: easing.standard });
  }, [clamped, reduced, value]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${value.value * 100}%` }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }, style]}>
      <Animated.View
        style={[styles.fill, { backgroundColor: color, borderRadius: height / 2 }, animatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
