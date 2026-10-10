import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Wallet } from 'lucide-react-native';
import type { DateRange } from '@/types';
import { computeBudgetUsage, computeCategoryBudgets } from '@/services/finance/budget';
import { getCategoryOrDefault } from '@/constants/categories';
import { useAppData } from '@/store/AppDataContext';
import { colors, radius, spacing } from '@/theme';
import { rangeForPreset } from '@/utils/date';
import { formatMinor } from '@/utils/money';
import { AmountText } from '@/components/ui/AmountText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { StackHeader } from '@/components/ui/StackHeader';
import { Text } from '@/components/ui/Text';

/** Kullanım oranına göre limit göstergesi rengi. */
function usageColor(usage: number, over: boolean): string {
  if (over) return colors.expense;
  if (usage > 0.75) return colors.warning;
  return colors.primary;
}

/**
 * Bütçe durumu ekranı (kayan banttan ve finans sekmesinden açılır).
 *
 * Bu ayki toplam bütçe kullanımını ve kategori limitlerinin ne kadar
 * aşıldığını/kaldığını hesaplayıp gösterir. Düzenleme için budget-form'a
 * yönlendirir; bu ekran yalnızca okuma amaçlıdır.
 */
export default function BudgetScreen(): React.JSX.Element {
  const router = useRouter();
  const { data } = useAppData();
  const currency = data.preferences.currency;

  const range = useMemo<DateRange | null>(() => rangeForPreset('thisMonth'), []);
  const usage = useMemo(
    () => computeBudgetUsage(data.budget, data.transactions, range),
    [data.budget, data.transactions, range],
  );
  const rows = useMemo(
    () => computeCategoryBudgets(data.budget, data.transactions, range),
    [data.budget, data.transactions, range],
  );

  const overRows = useMemo(() => rows.filter((row) => row.overBudget), [rows]);
  const overTotalMinor = useMemo(
    () => overRows.reduce((sum, row) => sum + (row.spentMinor - row.limitMinor), 0),
    [overRows],
  );

  const isEmpty = !usage.hasBudget && rows.length === 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <StackHeader title="Bütçe Durumu" subtitle="Bu ay" />
        </View>

        {isEmpty ? (
          <EmptyState
            icon={Wallet}
            title="Bütçe belirlenmemiş"
            description="Aylık toplam bütçe ve kategori limitleri belirleyerek harcamalarını takip et."
            actionLabel="Bütçe belirle"
            onAction={() => router.push('/budget-form')}
          />
        ) : (
          <>
            {usage.hasBudget ? (
              <Card style={styles.totalCard}>
                <View style={styles.totalHeader}>
                  <Text variant="caption" color={colors.textMuted}>
                    Aylık toplam bütçe
                  </Text>
                  <Text
                    variant="micro"
                    color={usage.overBudget ? colors.expense : colors.primary}
                  >
                    {usage.overBudget ? 'LİMİT AŞILDI' : `%${Math.round(usage.usage * 100)}`}
                  </Text>
                </View>

                <View style={styles.totalAmounts}>
                  <AmountText minor={usage.spentMinor} currency={currency} variant="h1" />
                  <Text variant="body" color={colors.textMuted}>
                    {' '}
                    / {formatMinor(usage.totalMinor, currency)}
                  </Text>
                </View>

                <ProgressBar
                  progress={usage.usage}
                  color={usageColor(usage.usage, usage.overBudget)}
                  style={styles.totalBar}
                />

                <Text
                  variant="bodyStrong"
                  color={usage.overBudget ? colors.expense : colors.primary}
                  style={styles.totalNote}
                >
                  {usage.overBudget
                    ? `${formatMinor(usage.spentMinor - usage.totalMinor, currency)} aşıldı`
                    : `${formatMinor(usage.remainingMinor, currency)} kaldı`}
                </Text>
              </Card>
            ) : null}

            {overRows.length > 0 ? (
              <Card style={styles.alertCard}>
                <Text variant="bodyStrong" color={colors.expense}>
                  {overRows.length} kategori limiti aşıldı
                </Text>
                <Text variant="caption" color={colors.textSecondary} style={styles.alertText}>
                  Bu kategorilerde toplam {formatMinor(overTotalMinor, currency)} fazla harcadınız.
                </Text>
              </Card>
            ) : null}

            <Text variant="h3" style={styles.sectionTitle}>
              Kategori limitleri
            </Text>

            {rows.length === 0 ? (
              <Text variant="caption" color={colors.textMuted}>
                Kategori limiti tanımlanmamış. Aşağıdan limitleri düzenleyebilirsin.
              </Text>
            ) : (
              rows.map((row, index) => {
                const category = getCategoryOrDefault(row.categoryId);
                const barColor = row.overBudget
                  ? colors.expense
                  : row.usage > 0.75
                    ? colors.warning
                    : category.color;
                const diff = row.spentMinor - row.limitMinor;
                return (
                  <Card
                    key={row.categoryId}
                    style={index > 0 ? styles.rowSpacing : undefined}
                  >
                    <View style={styles.rowHeader}>
                      <View style={[styles.dot, { backgroundColor: category.color }]} />
                      <Text variant="bodyStrong" style={styles.rowName} numberOfLines={1}>
                        {category.name}
                      </Text>
                      <Text
                        variant="label"
                        color={row.overBudget ? colors.expense : colors.textSecondary}
                        tabular
                      >
                        {formatMinor(row.spentMinor, currency)} / {formatMinor(row.limitMinor, currency)}
                      </Text>
                    </View>
                    <ProgressBar progress={row.usage} color={barColor} style={styles.rowBar} />
                    <Text
                      variant="caption"
                      color={row.overBudget ? colors.expense : colors.textMuted}
                      style={styles.rowNote}
                    >
                      {row.overBudget
                        ? `${formatMinor(diff, currency)} aşıldı`
                        : `${formatMinor(row.limitMinor - row.spentMinor, currency)} kaldı`}
                    </Text>
                  </Card>
                );
              })
            )}

            <Button
              label="Limitleri düzenle"
              variant="secondary"
              onPress={() => router.push('/budget-form')}
              fullWidth
              style={styles.editButton}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.huge + spacing.xxl,
  },
  headerWrap: { marginBottom: spacing.xs },
  totalCard: { marginBottom: spacing.lg },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalAmounts: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm },
  totalBar: { marginTop: spacing.lg },
  totalNote: { marginTop: spacing.md },
  alertCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.expenseSoft,
    borderColor: 'rgba(255, 107, 94, 0.35)',
    borderRadius: radius.lg,
  },
  alertText: { marginTop: spacing.xs },
  sectionTitle: { marginTop: spacing.sm, marginBottom: spacing.md },
  rowSpacing: { marginTop: spacing.md },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowName: { flex: 1 },
  rowBar: { marginTop: spacing.md },
  rowNote: { marginTop: spacing.sm },
  editButton: { marginTop: spacing.xxl },
});
