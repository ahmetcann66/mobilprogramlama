import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Coins, TriangleAlert } from 'lucide-react-native';
import type { Budget, Transaction } from '@/types';
import { computeBudgetUsage, computeCategoryBudgets } from '@/services/finance/budget';
import { getCategoryOrDefault } from '@/constants/categories';
import { rangeForPreset } from '@/utils/date';
import { formatMinor } from '@/utils/money';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, iconSize, radius, spacing } from '@/theme';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';

interface Segment {
  readonly id: string;
  readonly text: string;
  readonly over: boolean;
  readonly dotColor: string;
}

export interface BudgetTickerProps {
  readonly budget: Budget;
  readonly transactions: readonly Transaction[];
  readonly currency?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly onPress?: () => void;
}

/** Yalnızca bu ayın limitlerini değerlendiren segment listesi üretir. */
function buildSegments(
  budget: Budget,
  transactions: readonly Transaction[],
  currency: string,
): Segment[] {
  const monthRange = rangeForPreset('thisMonth');
  const usage = computeBudgetUsage(budget, transactions, monthRange);
  const rows = computeCategoryBudgets(budget, transactions, monthRange);

  const segments: Segment[] = [];

  if (usage.hasBudget) {
    segments.push({
      id: 'total',
      text: usage.overBudget
        ? `Aylık bütçe aşıldı (${formatMinor(-usage.remainingMinor, currency)} üzeri)`
        : `Aylık bütçeden ${formatMinor(usage.remainingMinor, currency)} kaldı`,
      over: usage.overBudget,
      dotColor: usage.overBudget ? colors.expense : colors.primary,
    });
  }

  for (const row of rows) {
    const category = getCategoryOrDefault(row.categoryId);
    if (row.overBudget) {
      segments.push({
        id: `over:${row.categoryId}`,
        text: `${category.name} limiti aşıldı (${formatMinor(row.spentMinor - row.limitMinor, currency)})`,
        over: true,
        dotColor: colors.expense,
      });
    } else {
      segments.push({
        id: `left:${row.categoryId}`,
        text: `${category.name}: ${formatMinor(row.limitMinor - row.spentMinor, currency)} kaldı`,
        over: false,
        dotColor: category.color,
      });
    }
  }

  return segments;
}

/** Tek bir segment satırını (soldan sağa) çizer. */
function SegmentRow({ segments }: { readonly segments: readonly Segment[] }): React.JSX.Element {
  return (
    <View style={styles.copyRow}>
      {segments.map((segment) => (
        <View key={segment.id} style={styles.segment}>
          <View style={[styles.dot, { backgroundColor: segment.dotColor }]} />
          <Text variant="caption" color={segment.over ? colors.expense : colors.textSecondary} numberOfLines={1}>
            {segment.text}
          </Text>
        </View>
      ))}
      <View style={styles.separator} />
    </View>
  );
}

/**
 * Ana sayfadaki dönem seçicinin altına yerleşen bütçe uyarı bandı.
 *
 * Kategori limitleri ve aylık bütçe kullanımını bu ay için özetler; limiti
 * aşılan kalemler kırmızı, kalan haklar normal renkte gösterilir. İçerik
 * kesintisiz kayar (marquee). Limit tanımlı değilse hiçbir şey çizmez ve
 * yer kaplamaz; böylece ana sayfa düzeni değişmez. "Reduce Motion" açıksa
 * sabit, sarmalayan bir satırla sadeleşir.
 */
export function BudgetTicker({
  budget,
  transactions,
  currency = 'TRY',
  style,
  onPress,
}: BudgetTickerProps): React.JSX.Element | null {
  const reduced = useReducedMotion();

  const segments = useMemo(
    () => buildSegments(budget, transactions, currency),
    [budget, transactions, currency],
  );

  // Limit tanımlı değilse bant görünmez (yer kaplamaz).
  if (segments.length === 0) return null;

  const hasAlerts = segments.some((segment) => segment.over);

  const content = reduced ? (
    <View style={styles.wrap}>
      {segments.map((segment) => (
        <View key={segment.id} style={[styles.segment, styles.segmentWrap]}>
          <View style={[styles.dot, { backgroundColor: segment.dotColor }]} />
          <Text variant="caption" color={segment.over ? colors.expense : colors.textSecondary} numberOfLines={1}>
            {segment.text}
          </Text>
        </View>
      ))}
    </View>
  ) : (
    <Marquee segments={segments} />
  );

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole={onPress !== undefined ? 'button' : undefined}
      accessibilityLabel="Bütçe durumu"
      style={[styles.container, style]}
    >
      <View style={styles.iconBubble}>
        {hasAlerts ? (
          <TriangleAlert size={iconSize.xs} color={colors.expense} />
        ) : (
          <Coins size={iconSize.xs} color={colors.primary} />
        )}
      </View>
      <View style={styles.scroll}>{content}</View>
    </PressableScale>
  );
}

function Marquee({ segments }: { readonly segments: readonly Segment[] }): React.JSX.Element {
  const translateX = useSharedValue(0);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (trackWidth <= 0) return;
    const distance = trackWidth / 2;
    const duration = Math.max(10_000, Math.round(distance * 30));
    translateX.value = withRepeat(withTiming(-distance, { duration, easing: Easing.linear }), -1, false);
  }, [trackWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onTrackLayout = (event: LayoutChangeEvent): void => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.overflow}>
      <Animated.View style={[styles.track, animatedStyle]} onLayout={onTrackLayout}>
        <SegmentRow segments={segments} />
        <SegmentRow segments={segments} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.xxs + 1,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    overflow: 'hidden',
  },
  iconBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHighlight,
    marginRight: spacing.sm,
  },
  scroll: { flex: 1 },
  overflow: { overflow: 'hidden' },
  // alignSelf: 'flex-start' olmadan track, ebeveynin genişliğine gerilir ve
  // onLayout gerçek içerik genişliğini vermez; bu yüzden kayan mesafe yanlış
  // hesaplanır ve içerik tam görünmez.
  track: { flexDirection: 'row', alignSelf: 'flex-start' },
  copyRow: { flexDirection: 'row', alignItems: 'center' },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  segmentWrap: { paddingTop: spacing.xs },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: spacing.xs,
  },
  separator: { width: spacing.md },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xxs,
  },
});