import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, duration, easing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** 0..1 arası ilerleme. */
  readonly progress: number;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly color?: string;
  readonly trackColor?: string;
  /** Saat yönünde başlangıç açısı (varsayılan üstten başlar). */
  readonly children?: React.ReactNode;
}

/** SVG tabanlı halka ilerleme göstergesi; ortasına içerik alabilir. */
export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = colors.primary,
  trackColor = colors.surfaceHighlight,
  children,
}: ProgressRingProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;

  const progressValue = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    progressValue.value = reduced
      ? clamped
      : withTiming(clamped, { duration: duration.slower, easing: easing.enter });
  }, [clamped, reduced, progressValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressValue.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusValue}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radiusValue}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
