import React, { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly style?: StyleProp<ViewStyle>;
}

/** Gösterge için içeri çekilme mesafesi: track border(1) + padding(xs=4). */
const INDICATOR_INSET = 5;

/** Gösterge için yay konfigürasyonu (hafif "taslak" hissi). */
const SPRING = { damping: 22, stiffness: 240, mass: 0.7 };

/**
 * Genel amaçlı segment kontrolü (dönem/tür seçimi). Jenerik tip sayesinde
 * yalnızca tanımlı değerlerin seçilmesine izin verir.
 *
 * Aktif seçim, yumuşak marka tonunda kayan bir "hap" göstergesiyle vurgulanır;
 * seçim değişiminde yay animasyonu kullanılır. Reduced Motion tercihine
 * uyar (animasyon yerine hızlı geçiş).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>): React.JSX.Element | null {
  const reduced = useReducedMotion();
  const count = options.length;

  const trackWidth = useSharedValue(0);
  const translateX = useSharedValue(0);

  const animateTo = useCallback(
    (index: number) => {
      const step = Math.max(0, trackWidth.value - INDICATOR_INSET * 2) / count;
      const target = index * step;
      if (reduced) {
        // eslint-disable-next-line react-hooks/immutability -- reanimated'ın resmi shared value API'si
        translateX.value = withTiming(target, { duration: 140 });
      } else {
        translateX.value = withSpring(target, SPRING);
      }
    },
    [count, reduced, trackWidth, translateX],
  );

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  useEffect(() => {
    animateTo(selectedIndex);
  }, [selectedIndex, animateTo]);

  const onTrackLayout = useCallback(
    (event: LayoutChangeEvent) => {
      // eslint-disable-next-line react-hooks/immutability -- reanimated'ın resmi shared value API'si
      trackWidth.value = event.nativeEvent.layout.width;
      animateTo(selectedIndex);
    },
    [animateTo, selectedIndex, trackWidth],
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const step = Math.max(0, trackWidth.value - INDICATOR_INSET * 2) / count;
    return {
      width: step,
      transform: [{ translateX: translateX.value }],
    };
  });

  if (count === 0) {
    return null;
  }

  return (
    <View style={[styles.track, style]} onLayout={onTrackLayout} collapsable={false}>
      <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={styles.segment}
          >
            <Text
              variant="label"
              color={selected ? colors.primary : colors.textSecondary}
              center
            >
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_INSET,
    bottom: INDICATOR_INSET,
    left: INDICATOR_INSET,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(31, 217, 140, 0.30)',
    borderRadius: radius.pill,
    ...shadows.soft,
  },
});