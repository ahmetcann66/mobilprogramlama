import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BarChart3, ChartPie, LineChart, Target, TrendingUp } from 'lucide-react-native';
import type { DateRange, Kpi, Minor, PeriodPreset, Transaction } from '@/types';
import { ExtendedPeriodPreset } from '@/types';
import { getCategoryOrDefault } from '@/constants/categories';
import {
  calculateExpenses,
  calculateIncome,
  groupByMonth,
  sumByCategory,
} from '@/services/finance/transactions';
import { activeHabits, weekCompletedCount } from '@/services/habits/habits';
import { computeGoalProgress, summarizeGoals } from '@/services/goals/goals';
import { useAppData } from '@/store/AppDataContext';
import { colors, iconSize, spacing } from '@/theme';
import {
  addDays,
  formatMonthYearTR,
  parseDateKey,
  rangeForPreset,
  toDateKey,
  todayKey,
  TR_MONTHS_SHORT,
} from '@/utils/date';
import { formatMinor, sumMinor } from '@/utils/money';
import { safePercent } from '@/utils/validation';
import { AmountText } from '@/components/ui/AmountText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart';
import { GroupedBarChart } from '@/components/charts/BarChart';

const PERIODS: { value: PeriodPreset; label: string }[] = [
  { value: ExtendedPeriodPreset.ThisMonth, label: 'Bu Ay' },
  { value: ExtendedPeriodPreset.LastMonth, label: 'Geçen Ay' },
  { value: ExtendedPeriodPreset.Last3Months, label: 'Son 3 Ay' },
  { value: ExtendedPeriodPreset.ThisYear, label: 'Bu Yıl' },
  { value: ExtendedPeriodPreset.All, label: 'Tümü' },
];

/** Seçili dönemin insan dostu etiketini türetir (ör. "Eylül 2026 dönemi"). */
function periodLabelFor(preset: PeriodPreset, range: DateRange | null): string {
  if (range === null) return 'Tüm zamanlar';
  const from = parseDateKey(range.from);
  const to = parseDateKey(range.to);
  if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) {
    return `${formatMonthYearTR(range.from)} dönemi`;
  }
  if (preset === 'thisYear') return `${from.getFullYear()} dönemi`;
  return `${formatMonthYearTR(range.from)} – ${formatMonthYearTR(range.to)}`;
}

/** Önceki dönemin tarih aralığını türetir (karşılaştırma için). */
function previousRangeFor(preset: PeriodPreset): DateRange | null {
  switch (preset) {
    case 'thisMonth': {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        from: toDateKey(prev),
        to: toDateKey(new Date(prev.getFullYear(), prev.getMonth() + 1, 0)),
      };
    }
    case 'lastMonth': {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return {
        from: toDateKey(prev),
        to: toDateKey(new Date(prev.getFullYear(), prev.getMonth() + 1, 0)),
      };
    }
    case 'last3Months': {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() - 3, 0);
      const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
      return { from: toDateKey(start), to: toDateKey(end) };
    }
    case 'thisYear': {
      const year = new Date().getFullYear() - 1;
      return { from: toDateKey(new Date(year, 0, 1)), to: toDateKey(new Date(year, 11, 31)) };
    }
    case 'all':
      return null;
  }
}

/** Aylık gelir/gider serisini üretir. */
function monthSeriesFor(
  transactions: readonly Transaction[],
  range: DateRange | null,
): { label: string; primary: number; secondary: number }[] {
  const grouped = groupByMonth(transactions);
  const keys = Object.keys(grouped).sort();

  const relevant = keys.filter(
    (key) =>
      (range === null || (key >= range.from.slice(0, 7) && key <= range.to.slice(0, 7))),
  );
  const pickedKeys = range === null ? relevant.slice(-6) : relevant;

  if (pickedKeys.length === 0) {
    const income = calculateIncome(transactions, range);
    const expense = calculateExpenses(transactions, range);
    if (income + expense === 0) return [];
    return [{ label: 'Dönem', primary: income, secondary: expense }];
  }

  return pickedKeys.map((key) => {
    const bucket = grouped[key];
    const monthIndex = Number.parseInt(key.slice(5, 7), 10) - 1;
    return {
      label: TR_MONTHS_SHORT[monthIndex] ?? key.slice(5),
      primary: bucket?.income ?? 0,
      secondary: bucket?.expense ?? 0,
    };
  });
}

interface Segment {
  readonly categoryId: string;
  readonly name: string;
  readonly color: string;
  readonly amount: Minor;
}

export default function InsightsScreen(): React.JSX.Element {
  const { data } = useAppData();
  const currency = data.preferences.currency;
  const [preset, setPreset] = useState<PeriodPreset>(ExtendedPeriodPreset.ThisMonth);

  const range = useMemo(() => rangeForPreset(preset), [preset]);
  const previousRange = useMemo(() => previousRangeFor(preset), [preset]);

  const kpis = useMemo<Kpi>(() => {
    const income = calculateIncome(data.transactions, range);
    const expense = calculateExpenses(data.transactions, range);
    return { income, expense, net: income - expense };
  }, [data.transactions, range]);

  const previousKpis = useMemo<Kpi | null>(() => {
    if (previousRange === null) return null;
    const prevTransactions = data.transactions.filter(
      (tx) => tx.date >= previousRange.from && tx.date <= previousRange.to,
    );
    if (prevTransactions.length === 0) return null;
    const income = calculateIncome(prevTransactions);
    const expense = calculateExpenses(prevTransactions);
    return { income, expense, net: income - expense };
  }, [data.transactions, previousRange]);
  const canCompare = previousKpis !== null;

  const series = useMemo(
    () => monthSeriesFor(data.transactions, range),
    [data.transactions, range],
  );

  const segments: Segment[] = useMemo(() => {
    const entries = Object.entries(sumByCategory(data.transactions, 'expense', range));
    return entries
      .map(([categoryId, amount]) => {
        const category = getCategoryOrDefault(categoryId);
        return { categoryId, name: category.name, color: category.color, amount };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [data.transactions, range]);

  const slices: DonutSlice[] = useMemo(() => {
    const top = segments.slice(0, 5);
    const rest = segments.slice(5);
    const restAmount = sumMinor(rest.map((item) => item.amount));
    const result = top.map((item) => ({
      key: item.categoryId,
      value: item.amount,
      color: item.color,
    }));
    if (restAmount > 0) result.push({ key: 'rest', value: restAmount, color: '#66738C' });
    return result;
  }, [segments]);

  const totalExpense = segments.reduce((sum, item) => sum + item.amount, 0);

  const habitRanks = useMemo(() => {
    // Tümü seçiliyken "son 14 gün" penceresi geçerli; belirli bir dönemde
    // tamamlama sayısı dönemin tamamında sayılır ve payda o pencerenin günüdür.
    const end = range?.to ?? todayKey();
    const start = range?.from ?? addDays(end, -13);
    const windowDays = Math.max(
      1,
      Math.round((parseDateKey(end).getTime() - parseDateKey(start).getTime()) / 86_400_000) + 1,
    );

    return activeHabits(data.habits)
      .map((habit) => {
        const completed = data.completions.filter(
          (c) => c.habitId === habit.id && c.date >= start && c.date <= end,
        ).length;
        // Günde birden fazla tamamlama sayılamayacağı varsayımıyla %100'ü aşmaz.
        return { habit, percent: Math.min(100, safePercent(completed, windowDays)) };
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);
  }, [data.habits, data.completions, range]);

  const weeklyTotal = weekCompletedCount(data.habits, data.completions, data.preferences.weekStartsOn);
  const goalSummary = summarizeGoals(data.goals, data.contributions);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Analiz" subtitle="Verilerinizi anlamlandırın" />

        <View style={styles.chips}>
          {PERIODS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={preset === option.value}
              onPress={() => setPreset(option.value)}
            />
          ))}
        </View>

        {kpis.income + kpis.expense === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Yeterli veri yok"
            description="Analizler gerçek kayıtlardan üretilir. Henüz gelir veya gider eklenmediği için grafik gösterilmiyor ve sahte veriyle doldurulmuyor."
          />
        ) : (
          <>
            <Card>
              <Text variant="label" color={colors.textMuted} style={styles.periodLabel}>
                {periodLabelFor(preset, range)}
              </Text>
              <View style={styles.kpiRow}>
                <View style={styles.kpiItem}>
                  <Text variant="caption" color={colors.textMuted}>
                    Gelir
                  </Text>
                  <AmountText minor={kpis.income} currency={currency} tone="income" variant="h3" />
                </View>
                <View style={styles.kpiItem}>
                  <Text variant="caption" color={colors.textMuted}>
                    Gider
                  </Text>
                  <AmountText minor={kpis.expense} currency={currency} tone="expense" variant="h3" />
                </View>
                <View style={styles.kpiItem}>
                  <Text variant="caption" color={colors.textMuted}>
                    Net
                  </Text>
                  <AmountText
                    minor={kpis.net}
                    currency={currency}
                    tone={kpis.net >= 0 ? 'income' : 'expense'}
                    variant="h3"
                  />
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.compareRow}>
                <TrendingUp size={iconSize.sm} color={canCompare ? colors.secondary : colors.textMuted} />
                {canCompare ? (
                  <Text variant="caption" color={colors.textSecondary} style={styles.compareText}>
                    Önceki dönemle karşılaştırma · gelir{' '}
                    <Text variant="caption" color={colors.income}>
                      {formatMinor(previousKpis!.income, currency)}
                    </Text>{' '}
                    · gider{' '}
                    <Text variant="caption" color={colors.expense}>
                      {formatMinor(previousKpis!.expense, currency)}
                    </Text>
                  </Text>
                ) : (
                  <Text variant="caption" color={colors.textMuted} style={styles.compareText}>
                    {preset === 'all'
                      ? 'Tüm zamanlar görünümünde önceki dönem karşılaştırması yapılmaz.'
                      : 'Önceki dönemde yeterli kayıt olmadığı için karşılaştırma yapılmadı.'}
                  </Text>
                )}
              </View>
            </Card>

            {series.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <LineChart size={iconSize.sm} color={colors.primary} />
                  <Text variant="h3">Gelir / gider dağılımı</Text>
                </View>
                <Card>
                  <GroupedBarChart data={series} />
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
                      <Text variant="caption" color={colors.textSecondary}>
                        Gelir
                      </Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
                      <Text variant="caption" color={colors.textSecondary}>
                        Gider
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            ) : null}

            {segments.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <ChartPie size={iconSize.sm} color={colors.expense} />
                  <Text variant="h3">Harcama dağılımı</Text>
                </View>
                <Card style={styles.donutCard}>
                  <DonutChart slices={slices} size={170} strokeWidth={20}>
                    <Text variant="h3" tabular>
                      {formatMinor(totalExpense, currency)}
                    </Text>
                    <Text variant="micro" color={colors.textMuted}>
                      toplam gider
                    </Text>
                  </DonutChart>

                  <View style={styles.categoryList}>
                    {segments.slice(0, 6).map((item, index) => (
                      <View key={item.categoryId}>
                        {index > 0 ? <Divider /> : null}
                        <View style={styles.categoryRow}>
                          <View style={[styles.dot, { backgroundColor: item.color }]} />
                          <Text variant="body" style={styles.categoryName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <View style={styles.categoryAmount}>
                            <Text variant="bodyStrong" tabular>
                              {formatMinor(item.amount, currency)}
                            </Text>
                            <Text variant="micro" color={colors.textMuted}>
                              %{safePercent(item.amount, totalExpense)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <BarChart3 size={iconSize.sm} color={colors.secondary} />
                <Text variant="h3">Alışkanlık özeti</Text>
              </View>
              <Card>
                <View style={styles.habitKpis}>
                  <View>
                    <Text variant="caption" color={colors.textMuted}>
                      Bu hafta tamamlanan
                    </Text>
                    <Text variant="h3" tabular>
                      {weeklyTotal}
                    </Text>
                  </View>
                  <View style={styles.habitKpiRight}>
                    <Text variant="caption" color={colors.textMuted}>
                      Aktif alışkanlık
                    </Text>
                    <Text variant="h3" tabular>
                      {activeHabits(data.habits).length}
                    </Text>
                  </View>
                </View>

                <Divider style={styles.divider} />

                {habitRanks.length === 0 ? (
                  <Text variant="caption" color={colors.textMuted}>
                    Bu dönemde tamamlanma kaydı yok. Alışkanlıklar ekranından takip etmeye devam edebilirsin.
                  </Text>
                ) : (
                  <>
                    <Text variant="label" color={colors.textSecondary} style={styles.mostConsistent}>
                      En düzenli alışkanlıklar
                    </Text>
                    {habitRanks.map((item, index) => (
                      <View key={item.habit.id} style={styles.habitRow}>
                        <Text variant="body" style={styles.habitName} numberOfLines={1}>
                          {index + 1}. {item.habit.name}
                        </Text>
                        <View style={styles.habitPercent}>
                          <Text variant="caption" color={colors.textSecondary} tabular>
                            %{item.percent}
                          </Text>
                          <View style={styles.habitBarTrack}>
                            <View
                              style={[
                                styles.habitBar,
                                {
                                  width: `${Math.max(0, Math.min(100, item.percent))}%`,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                    <Text variant="micro" color={colors.textMuted} style={styles.caveat}>
                      Not: Alışkanlık tamamlama oranı ile tasarruf arasında nedensellik iddia edilmez; veriler birlikte gösterilir.
                    </Text>
                  </>
                )}
              </Card>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Target size={iconSize.sm} color={colors.warning} />
                <Text variant="h3">Tasarruf hedefleri</Text>
              </View>
              <Card>
                {goalSummary.activeCount === 0 ? (
                  <Text variant="caption" color={colors.textMuted}>
                    Aktif tasarruf hedefi yok.
                  </Text>
                ) : (
                  <>
                    <View style={styles.goalAmounts}>
                      <AmountText minor={goalSummary.savedTotalMinor} currency={currency} variant="h3" />
                      <Text variant="caption" color={colors.textMuted}>
                        {' '}
                        / {formatMinor(goalSummary.targetTotalMinor, currency)}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={
                        goalSummary.targetTotalMinor > 0
                          ? goalSummary.savedTotalMinor / goalSummary.targetTotalMinor
                          : 0
                      }
                      color={colors.warning}
                      style={styles.goalBar}
                    />
                    {data.goals
                      .filter((goal) => goal.status === 'active')
                      .slice(0, 3)
                      .map((goal) => {
                        const progress = computeGoalProgress(goal, data.contributions);
                        return (
                          <View key={goal.id} style={styles.goalRow}>
                            <Text variant="body" style={styles.habitName} numberOfLines={1}>
                              {goal.name}
                            </Text>
                            <Text variant="caption" color={colors.textSecondary} tabular>
                              %{progress.percent}
                            </Text>
                          </View>
                        );
                      })}
                  </>
                )}
              </Card>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  periodLabel: { marginBottom: spacing.md },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  kpiItem: { flex: 1 },
  divider: { marginVertical: spacing.lg },
  compareRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  compareText: { flex: 1 },
  section: { marginTop: spacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  donutCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xl },
  categoryList: { flex: 1, flexBasis: 220 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { flex: 1 },
  categoryAmount: { alignItems: 'flex-end' },
  habitKpis: { flexDirection: 'row', justifyContent: 'space-between' },
  habitKpiRight: { alignItems: 'flex-end' },
  mostConsistent: { marginBottom: spacing.sm },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  habitName: { flex: 1 },
  habitPercent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  habitBarTrack: { width: 60, height: 6, borderRadius: 3, backgroundColor: colors.surfaceHighlight, overflow: 'hidden' },
  habitBar: { height: '100%', backgroundColor: colors.secondary, borderRadius: 3 },
  caveat: { marginTop: spacing.sm },
  goalAmounts: { flexDirection: 'row', alignItems: 'baseline' },
  goalBar: { marginTop: spacing.md },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  bottomSpacer: { height: spacing.huge },
});