import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, Flame } from 'lucide-react-native';
import type { Habit } from '@/types';
import { colors, iconSize, radius, spacing } from '@/theme';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { WeekDots } from './WeekDots';
import { HABIT_CATEGORY_META } from '@/constants/habits';

export interface HabitRowProps {
  readonly habit: Habit;
  readonly completedToday: boolean;
  readonly streak: number;
  readonly weekDots: readonly boolean[];
  readonly onToggle: (habit: Habit) => void;
  readonly onPress?: (habit: Habit) => void;
}

/** Tek bir alışkanlık satırı: tamamlama düğmesi, adı, seri ve haftalık izler. */
export function HabitRow({
  habit,
  completedToday,
  streak,
  weekDots,
  onToggle,
  onPress,
}: HabitRowProps): React.JSX.Element {
  const meta = HABIT_CATEGORY_META[habit.category];

  return (
    <View style={[styles.row, !habit.active ? styles.inactive : null]}>
      <PressableScale
        onPress={() => onToggle(habit)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completedToday }}
        accessibilityLabel={`${habit.name} tamamlandı olarak işaretle`}
        style={[styles.toggle, completedToday ? styles.toggleDone : null]}
      >
        <Check
          size={iconSize.sm}
          color={completedToday ? colors.textInverse : colors.textMuted}
          strokeWidth={3}
        />
      </PressableScale>

      <PressableScale
        onPress={() => onPress?.(habit)}
        disabled={onPress === undefined}
        accessibilityRole={onPress !== undefined ? 'button' : undefined}
        accessibilityLabel={habit.name}
        style={styles.content}
      >
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.name}>
            {habit.name}
          </Text>
          {streak > 0 ? (
            <View style={styles.streak}>
              <Flame size={13} color={colors.warning} />
              <Text variant="micro" color={colors.warning}>
                {streak}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.subRow}>
          <Text variant="caption" color={meta.color} numberOfLines={1}>
            {meta.label}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {' '}
            · 
          </Text>
          <WeekDots dots={weekDots} />
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  inactive: { opacity: 0.5 },
  toggle: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { flex: 1, marginRight: spacing.sm },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
});
