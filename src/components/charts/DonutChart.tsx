import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, duration, easing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface DonutSlice {
  readonly key: string;
  readonly value: number;
  readonly color: string;
}

export interface DonutChartProps {
  readonly slices: readonly DonutSlice[];
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly trackColor?: string;
  readonly children?: React.ReactNode;
}

/**
 * Kategori dağılımı için halka (donut) grafiği.
 *
 * Dilimler stroke-dasharray ile çizilir; bu yaklaşım %100'lük tek dilim
 * durumunda da doğru çalışır. Giriş animasyonu yalnızca opaklık/ölçek
 * üzerinden yapılır (performans için), böylece dilim geometrisi stabil kalır.
 */
export function DonutChart({
  slices,
  size = 180,
  strokeWidth = 22,
  trackColor = colors.surfaceHighlight,
  children,
}: DonutChartProps): React.JSX.Element {
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const reduced = useReducedMotion();

  useEffect(() => {
    const config = { duration: duration.slower, easing: easing.enter };
    if (reduced) {
      opacity.value = 1;
      scale.value = 1;
    } else {
      opacity.value = withTiming(1, config);
      scale.value = withTiming(1, config);
    }
  }, [reduced, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const gap = slices.length > 1 ? 3 : 0;
  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={animatedStyle}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radiusValue}
              stroke={trackColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {total > 0
              ? slices.map((slice) => {
                  const fraction = Math.max(0, slice.value) / total;
                  const length = Math.max(0, fraction * circumference - gap);
                  const dashOffset = -offset;
                  offset += fraction * circumference;
                  return (
                    <Circle
                      key={slice.key}
                      cx={size / 2}
                      cy={size / 2}
                      r={radiusValue}
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={[length, circumference - length]}
                      strokeDashoffset={dashOffset}
                    />
                  );
                })
              : null}
          </G>
        </Svg>
      </Animated.View>
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.center}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
