import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ListChecks,
  Sparkles,
  Target,
  TrendingDown,
  Wallet,
} from 'lucide-react-native';
import type { BasePeriodPreset } from '@/types';
import { PeriodPreset } from '@/types';
import { computeBudgetUsage } from '@/services/finance/budget';
import { calculateExpenses, calculateIncome, sortByDateDesc } from '@/services/finance/transactions';
import {
  dailyCompletionPercent,
  isCompletedOn,
  weeklyProgress,
} from '@/services/habits/habits';
import { computeGoalProgress, summarizeGoals } from '@/services/goals/goals';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, iconSize, spacing } from '@/theme';
import { formatDateTR, nowIso, rangeForPreset, todayKey, TR_WEEKDAYS } from '@/utils/date';
import { formatMinor } from '@/utils/money';
import { createId } from '@/utils/id';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { AmountText } from '@/components/ui/AmountText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { BudgetTicker } from '@/components/finance/BudgetTicker';
import { SummaryCard } from '@/components/finance/SummaryCard';
import { TransactionRow } from '@/components/finance/TransactionRow';
import { QuickAction } from '@/components/home/QuickAction';

const PERIOD_OPTIONS: { value: BasePeriodPreset; label: string }[] = [
  { value: PeriodPreset.ThisMonth, label: 'Bu Ay' },
  { value: PeriodPreset.LastMonth, label: 'Geçen Ay' },
  { value: PeriodPreset.All, label: 'Tümü' },
];

const PERIOD_LABEL: Record<BasePeriodPreset, string> = {
  [PeriodPreset.ThisMonth]: 'Bu ay',
  [PeriodPreset.LastMonth]: 'Geçen ay',
  [PeriodPreset.All]: 'Tüm zamanlar',
};

function greeting(hour: number): string {
  if (hour < 6) return 'İyi geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, dispatch } = useAppData();
  const haptics = useHaptics();
  const [period, setPeriod] = useState<BasePeriodPreset>(PeriodPreset.ThisMonth);

  const today = todayKey();
  const range = useMemo(() => rangeForPreset(period), [period]);

  const { income, expense, net } = useMemo(() => {
    const inc = calculateIncome(data.transactions, range);
    const exp = calculateExpenses(data.transactions, range);
    return { income: inc, expense: exp, net: inc - exp };
  }, [data.transactions, range]);

  // Bütçe her zaman "bu ay" mantığıyla değerlendirilir (dönem bağımsız).
  const budget = useMemo(
    () => computeBudgetUsage(data.budget, data.transactions, rangeForPreset('thisMonth')),
    [data.budget, data.transactions],
  );

  const habitsToday = useMemo(() => data.habits.filter((habit) => habit.active), [data.habits]);
  const doneToday = habitsToday.filter((habit) => isCompletedOn(data.completions, habit.id, today)).length;
  const todayPercent = dailyCompletionPercent(data.habits, data.completions, today);
  const weekly = weeklyProgress(data.habits, data.completions, data.preferences.weekStartsOn, today);

  const goalSummary = summarizeGoals(data.goals, data.contributions);
  const topGoal = data.goals.find((goal) => goal.status === 'active');
  const topGoalProgress = topGoal !== undefined ? computeGoalProgress(topGoal, data.contributions) : null;

  const recent = useMemo(() => sortByDateDesc(data.transactions).slice(0, 4), [data.transactions]);

  const isEmpty =
    data.transactions.length === 0 && data.habits.length === 0 && data.goals.length === 0;

  const onToggleHabit = (habitId: string): void => {
    const wasDone = isCompletedOn(data.completions, habitId, today);
    dispatch({
      type: 'toggle-completion',
      completion: { id: createId('cmp'), habitId, date: today, completedAt: nowIso() },
    });
    if (wasDone) haptics.light();
    else haptics.success();
  };

  const dateLabel = `${TR_WEEKDAYS[new Date().getDay()]}, ${formatDateTR(today)}`;
  const name = data.preferences.displayName.trim();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntrance>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text variant="label" color={colors.textSecondary}>
                {dateLabel}
              </Text>
              <Text variant="h1" style={styles.greeting}>
                {greeting(new Date().getHours())}
                {name !== '' ? `, ${name}` : ''}
              </Text>
            </View>
            <PressableScale
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Profil ve ayarlar"
            >
              <Avatar name={name === '' ? 'FinHabit' : name} />
            </PressableScale>
          </View>
        </AnimatedEntrance>

        {isEmpty ? (
          <AnimatedEntrance delay={40}>
            <Card style={styles.welcome}>
              <EmptyState
                icon={Sparkles}
                title="FinHabit'e hoş geldiniz"
                description="Henüz kayıt yok. İlk gelir/giderinizi ekleyin veya bir alışkanlık oluşturun; raporlarınız otomatik oluşsun."
              />
              <View style={styles.welcomeActions}>
                <Button
                  label="Gelir ekle"
                  icon={<ArrowUpRight size={iconSize.sm} color={colors.textInverse} />}
                  onPress={() => router.push({ pathname: '/transaction-form', params: { type: 'income' } })}
                  style={styles.welcomeButton}
                />
                <Button
                  label="Alışkanlık ekle"
                  variant="secondary"
                  icon={<ListChecks size={iconSize.sm} color={colors.text} />}
                  onPress={() => router.push('/habit-form')}
                  style={styles.welcomeButton}
                />
              </View>
            </Card>
          </AnimatedEntrance>
        ) : (
          <>
            <AnimatedEntrance delay={40} style={styles.periodRow}>
              <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
              {data.transactions.length > 0 ? (
                <BudgetTicker
                  budget={data.budget}
                  transactions={data.transactions}
                  currency={data.preferences.currency}
                  onPress={() => router.push('/budget')}
                  style={styles.ticker}
                />
              ) : null}
              <Text variant="caption" color={colors.textMuted} style={styles.periodHint}>
                {PERIOD_LABEL[period]} özeti
              </Text>
            </AnimatedEntrance>

            <AnimatedEntrance delay={80}>
              <SummaryCard income={income} expense={expense} net={net} currency={data.preferences.currency} budget={budget} />
            </AnimatedEntrance>

            <AnimatedEntrance delay={140} style={styles.section}>
              <View style={styles.quickRow}>
                <QuickAction
                  icon={ArrowUpRight}
                  label="Gelir ekle"
                  color={colors.income}
                  onPress={() => router.push({ pathname: '/transaction-form', params: { type: 'income' } })}
                />
                <QuickAction
                  icon={TrendingDown}
                  label="Gider ekle"
                  color={colors.expense}
                  onPress={() => router.push({ pathname: '/transaction-form', params: { type: 'expense' } })}
                />
                <QuickAction
                  icon={ListChecks}
                  label="Alışkanlık"
                  color={colors.info}
                  onPress={() => router.push('/habit-form')}
                />
                <QuickAction
                  icon={Target}
                  label="Hedef"
                  color={colors.secondary}
                  onPress={() => router.push('/goal-form')}
                />
              </View>
            </AnimatedEntrance>

            <AnimatedEntrance delay={200} style={styles.section}>
              <Card>
                <View style={styles.habitHeader}>
                  <ProgressRing progress={todayPercent / 100} size={92} strokeWidth={9}>
                    <Text variant="h3" tabular>
                      %{todayPercent}
                    </Text>
                    <Text variant="micro" color={colors.textMuted}>
                      bugün
                    </Text>
                  </ProgressRing>
                  <View style={styles.habitInfo}>
                    <Text variant="h3">Bugünün alışkanlıkları</Text>
                    <Text variant="caption" color={colors.textSecondary} style={styles.habitSub}>
                      {doneToday}/{habitsToday.length} tamamlandı · haftalık %{weekly.percent}
                    </Text>
                    {habitsToday.length === 0 ? (
                      <Button
                        label="Alışkanlık oluştur"
                        size="sm"
                        variant="secondary"
                        onPress={() => router.push('/habit-form')}
                        style={styles.habitButton}
                      />
                    ) : null}
                  </View>
                </View>

                {habitsToday.length > 0 ? (
                  <View style={styles.habitList}>
                    <Divider style={styles.habitDivider} />
                    {habitsToday.slice(0, 3).map((habit) => {
                      const done = isCompletedOn(data.completions, habit.id, today);
                      return (
                        <PressableScale
                          key={habit.id}
                          onPress={() => onToggleHabit(habit.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`${habit.name} alışkanlığını ${done ? 'geri al' : 'tamamla'}`}
                          style={styles.habitItem}
                        >
                          <Text
                            variant="body"
                            style={styles.habitName}
                            numberOfLines={1}
                            color={done ? colors.textMuted : colors.text}
                          >
                            {done ? '✓ ' : '○ '}
                            {habit.name}
                          </Text>
                          {done ? <CheckCircle2 size={iconSize.sm} color={colors.primary} /> : null}
                        </PressableScale>
                      );
                    })}
                    <PressableScale
                      onPress={() => router.push('/habits')}
                      accessibilityRole="button"
                      accessibilityLabel="Tüm alışkanlıkları gör"
                      style={styles.linkRow}
                    >
                      <Text variant="label" color={colors.primary}>
                        Tüm alışkanlıklar
                      </Text>
                      <ArrowRight size={iconSize.sm} color={colors.primary} />
                    </PressableScale>
                  </View>
                ) : null}
              </Card>
            </AnimatedEntrance>

            <AnimatedEntrance delay={260} style={styles.section}>
              <Card>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleWrap}>
                    <Text variant="h3">Tasarruf hedefleri</Text>
                    <Text variant="caption" color={colors.textSecondary} style={styles.habitSub}>
                      {goalSummary.activeCount} aktif hedef
                    </Text>
                  </View>
                  <Target size={iconSize.md} color={colors.secondary} />
                </View>

                {goalSummary.activeCount === 0 ? (
                  <Button
                    label="Hedef oluştur"
                    size="sm"
                    variant="secondary"
                    onPress={() => router.push('/goal-form')}
                    style={styles.goalButton}
                  />
                ) : (
                  <>
                    <View style={styles.goalAmounts}>
                      <AmountText minor={goalSummary.savedTotalMinor} currency={data.preferences.currency} variant="h3" />
                      <Text variant="caption" color={colors.textMuted}>
                        {' / '}
                        {formatMinor(goalSummary.targetTotalMinor, data.preferences.currency)}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={
                        goalSummary.targetTotalMinor > 0
                          ? goalSummary.savedTotalMinor / goalSummary.targetTotalMinor
                          : 0
                      }
                      color={colors.secondary}
                      style={styles.goalBar}
                    />
                    {topGoal !== undefined && topGoalProgress !== null ? (
                      <Text variant="caption" color={colors.textSecondary} style={styles.goalTop}>
                        En yakın: {topGoal.name} · %{topGoalProgress.percent}
                      </Text>
                    ) : null}
                    <PressableScale
                      onPress={() => router.push('/goals')}
                      accessibilityRole="button"
                      accessibilityLabel="Tüm hedefleri gör"
                      style={styles.linkRow}
                    >
                      <Text variant="label" color={colors.secondary}>
                        Tüm hedefler
                      </Text>
                      <ArrowRight size={iconSize.sm} color={colors.secondary} />
                    </PressableScale>
                  </>
                )}
              </Card>
            </AnimatedEntrance>

            <AnimatedEntrance delay={320} style={styles.section}>
              <Card>
                <View style={styles.recentHeader}>
                  <Text variant="h3">Son işlemler</Text>
                  <PressableScale
                    onPress={() => router.push('/finance')}
                    accessibilityRole="button"
                    accessibilityLabel="Tüm işlemler"
                    style={styles.linkRow}
                  >
                    <Text variant="label" color={colors.primary}>
                      Tümü
                    </Text>
                    <ArrowRight size={iconSize.sm} color={colors.primary} />
                  </PressableScale>
                </View>

                {recent.length === 0 ? (
                  <View style={styles.recentEmpty}>
                    <Wallet size={iconSize.lg} color={colors.textMuted} />
                    <Text variant="caption" color={colors.textMuted} center style={styles.recentEmptyText}>
                      Henüz işlem yok. İlk gelir veya giderini ekle.
                    </Text>
                  </View>
                ) : (
                  recent.map((tx, index) => (
                    <View key={tx.id}>
                      {index > 0 ? <Divider /> : null}
                      <TransactionRow
                        transaction={tx}
                        currency={data.preferences.currency}
                        onPress={() =>
                          router.push({ pathname: '/transaction-form', params: { id: tx.id } })
                        }
                      />
                    </View>
                  ))
                )}
              </Card>
            </AnimatedEntrance>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  headerText: { flex: 1 },
  greeting: { marginTop: spacing.xxs },
  welcome: { marginBottom: spacing.xl },
  welcomeActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  welcomeButton: { flex: 1 },
  periodRow: { marginBottom: spacing.lg },
  ticker: { marginTop: spacing.sm },
  periodHint: { marginTop: spacing.sm, textAlign: 'center' },
  section: { marginTop: spacing.xl },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  habitHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  habitInfo: { flex: 1 },
  habitSub: { marginTop: spacing.xxs },
  habitButton: { marginTop: spacing.md, alignSelf: 'flex-start' },
  habitList: { marginTop: spacing.md },
  habitDivider: { marginBottom: spacing.sm },
  habitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  habitName: { flex: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, alignSelf: 'flex-start' },
  goalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalTitleWrap: { flex: 1 },
  goalButton: { marginTop: spacing.lg, alignSelf: 'flex-start' },
  goalAmounts: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.lg },
  goalBar: { marginTop: spacing.md },
  goalTop: { marginTop: spacing.sm },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentEmpty: { alignItems: 'center', paddingVertical: spacing.xl },
  recentEmptyText: { marginTop: spacing.sm },
  bottomSpacer: { height: spacing.xxxl },
});
