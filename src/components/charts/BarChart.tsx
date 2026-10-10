import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors, duration, easing, radius, spacing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Text } from '@/components/ui/Text';

export interface BarDatum {
  readonly label: string;
  readonly value: number;
}

export interface GroupedBarDatum {
  readonly label: string;
  readonly primary: number;
  readonly secondary: number;
}

interface BarProps {
  readonly fraction: number;
  readonly color: string;
  readonly width: number | `${number}%`;
  readonly delay: number;
}

function AnimatedBar({ fraction, color, width, delay }: BarProps): React.JSX.Element {
  const safe = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const value = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    value.value = reduced
      ? safe
      : withDelay(delay, withTiming(safe, { duration: duration.slower, easing: easing.enter }));
  }, [safe, reduced, value, delay]);

  const animatedStyle = useAnimatedStyle(() => ({ height: `${value.value * 100}%` }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: color, width },
        animatedStyle,
      ]}
    />
  );
}

const CHART_HEIGHT = 140;

export interface BarChartProps {
  readonly data: readonly BarDatum[];
  readonly color?: string;
  readonly height?: number;
}

/** Tek serili basit dikey çubuk grafiği. */
export function BarChart({ data, color = colors.primary }: BarChartProps): React.JSX.Element {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={styles.row}>
      {data.map((datum, index) => (
        <View key={`${datum.label}-${index}`} style={styles.column}>
          <View style={styles.barTrack}>
            <AnimatedBar
              fraction={datum.value / max}
              color={color}
              width="100%"
              delay={index * 40}
            />
          </View>
          <Text variant="micro" color={colors.textMuted} center numberOfLines={1}>
            {datum.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export interface GroupedBarChartProps {
  readonly data: readonly GroupedBarDatum[];
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
}

/** İki serili (örn. gelir vs gider) karşılaştırmalı çubuk grafiği. */
export function GroupedBarChart({
  data,
  primaryColor = colors.income,
  secondaryColor = colors.expense,
}: GroupedBarChartProps): React.JSX.Element {
  const max = Math.max(1, ...data.flatMap((d) => [d.primary, d.secondary]));
  return (
    <View style={styles.row}>
      {data.map((datum, index) => (
        <View key={`${datum.label}-${index}`} style={styles.column}>
          <View style={styles.barTrack}>
            <View style={styles.group}>
              <AnimatedBar
                fraction={datum.primary / max}
                color={primaryColor}
                width="46%"
                delay={index * 50}
              />
              <AnimatedBar
                fraction={datum.secondary / max}
                color={secondaryColor}
                width="46%"
                delay={index * 50 + 30}
              />
            </View>
          </View>
          <Text variant="micro" color={colors.textMuted} center numberOfLines={1}>
            {datum.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  column: { flex: 1, alignItems: 'center' },
  barTrack: { height: CHART_HEIGHT, width: '100%', justifyContent: 'flex-end', marginBottom: spacing.sm },
  group: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%' },
  bar: { borderRadius: radius.xs, minHeight: 3 },
});
