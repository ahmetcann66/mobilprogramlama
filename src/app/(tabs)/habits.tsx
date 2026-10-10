import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame, ListChecks, Target } from 'lucide-react-native';
import type { Habit, HabitCategory } from '@/types';
import { HABIT_CATEGORIES, HABIT_CATEGORY_META } from '@/constants/habits';
import {
  activeHabits,
  calculateHabitStreak,
  isCompletedOn,
  recentCompletionMap,
  weeklyProgress,
} from '@/services/habits/habits';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing } from '@/theme';
import { todayKey } from '@/utils/date';
import { createId } from '@/utils/id';
import { nowIso } from '@/utils/date';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { HabitRow } from '@/components/habits/HabitRow';

function categoryOptions(): { value: HabitCategory | 'all'; label: string }[] {
  return [
    { value: 'all', label: 'Tümü' },
    ...HABIT_CATEGORIES.map((key) => ({ value: key, label: HABIT_CATEGORY_META[key].label })),
  ];
}

export default function HabitsScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, dispatch } = useAppData();
  const haptics = useHaptics();
  const [category, setCategory] = useState<HabitCategory | 'all'>('all');

  const today = todayKey();
  const shown = useMemo(() => {
    const list = data.habits.filter(
      (habit) => category === 'all' || habit.category === category,
    );
    return [...list].sort((a, b) => Number(b.active) - Number(a.active));
  }, [data.habits, category]);

  const weekly = weeklyProgress(data.habits, data.completions, data.preferences.weekStartsOn, today);
  const active = activeHabits(data.habits);
  const bestStreak = useMemo(() => {
    return active.reduce(
      (max, habit) =>
        Math.max(max, calculateHabitStreak(data.completions, habit.id, today)),
      0,
    );
  }, [active, data.completions, today]);

  const toggle = (habit: Habit): void => {
    const wasDone = isCompletedOn(data.completions, habit.id, today);
    dispatch({
      type: 'toggle-completion',
      completion: { id: createId('cmp'), habitId: habit.id, date: today, completedAt: nowIso() },
    });
    if (wasDone) haptics.light();
    else haptics.success();
  };

  const header = (
    <View>
      <ScreenHeader title="Alışkanlıklar" subtitle="Günlük ve haftalık takip" />

      <Card style={styles.weekly}>
        <ProgressRing progress={weekly.percent / 100} size={104} strokeWidth={10} color={colors.primary}>
          <Text variant="h3" tabular>
            %{weekly.percent}
          </Text>
          <Text variant="micro" color={colors.textMuted}>
            hafta
          </Text>
        </ProgressRing>
        <View style={styles.weeklyInfo}>
          <Text variant="h3">Haftalık ilerleme</Text>
          <Text variant="caption" color={colors.textSecondary} style={styles.weeklySub}>
            {weekly.completed}/{weekly.total} tamamlanma
          </Text>
          <View style={styles.weeklyBadges}>
            <View style={styles.badgePill}>
              <Flame size={14} color={colors.warning} />
              <Text variant="label" color={colors.warning}>
                {bestStreak} günlük seri
              </Text>
            </View>
            <View style={styles.badgePill}>
              <Target size={14} color={colors.secondary} />
              <Text variant="label" color={colors.secondary}>
                {active.length} aktif
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.chips}>
        {categoryOptions().map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={category === option.value}
            onPress={() => setCategory(option.value)}
            accent={HABIT_CATEGORY_META[option.value === 'all' ? 'custom' : option.value]?.color ?? colors.primary}
          />
        ))}
      </View>

      {shown.length > 0 ? (
        <Text variant="label" color={colors.textSecondary} style={styles.counter}>
          {shown.length} alışkanlık
        </Text>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <View>
            {index === 0 && shown[0] !== undefined ? (
              <Divider style={styles.firstDivider} />
            ) : null}
            <HabitRow
              habit={item}
              completedToday={isCompletedOn(data.completions, item.id, today)}
              streak={calculateHabitStreak(data.completions, item.id, today)}
              weekDots={recentCompletionMap(data.completions, item.id, 7, today)}
              onToggle={toggle}
              onPress={(habit) => router.push({ pathname: '/habit-form', params: { id: habit.id } })}
            />
            <Divider />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={ListChecks}
            title="Alışkanlık yok"
            description={
              data.habits.length === 0
                ? 'Yeni bir alışkanlık oluşturarak günlük disiplinini takip etmeye başla.'
                : 'Bu kategoride alışkanlık bulunmuyor.'
            }
            actionLabel={data.habits.length === 0 ? 'Alışkanlık oluştur' : undefined}
            onAction={data.habits.length === 0 ? () => router.push('/habit-form') : undefined}
          />
        }
        ListFooterComponent={<View style={styles.footerSpacer} />}
      />

      <FAB
        onPress={() => router.push('/habit-form')}
        accessibilityLabel="Yeni alışkanlık ekle"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.huge + spacing.xxl },
  weekly: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  weeklyInfo: { flex: 1 },
  weeklySub: { marginTop: spacing.xxs },
  weeklyBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  counter: { marginTop: spacing.lg, marginBottom: spacing.sm },
  firstDivider: { marginBottom: spacing.sm },
  footerSpacer: { height: spacing.huge },
});