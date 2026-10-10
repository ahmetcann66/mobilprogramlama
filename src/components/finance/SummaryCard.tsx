import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react-native';
import type { Minor } from '@/types';
import type { BudgetUsage } from '@/services/finance/budget';
import { colors, spacing } from '@/theme';
import { formatMinor } from '@/utils/money';
import { AmountText } from '@/components/ui/AmountText';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';

export interface SummaryCardProps {
  readonly income: Minor;
  readonly expense: Minor;
  readonly net: Minor;
  readonly currency?: string;
  readonly budget: BudgetUsage;
}

/**
 * Dashboard'ın öne çıkan finansal özet kartı: dönemsel net fark büyük
 * gösterilir; gelir ve gider yan yana; altta bütçe kullanım çubuğu yer alır.
 * Tüm değerler gerçek kayıtlardan hesaplanır.
 */
export function SummaryCard({
  income,
  expense,
  net,
  currency = 'TRY',
  budget,
}: SummaryCardProps): React.JSX.Element {
  const netTone = net > 0 ? 'income' : net < 0 ? 'expense' : 'neutral';
  const NetIcon = net > 0 ? ArrowUpRight : net < 0 ? ArrowDownRight : Minus;
  const netColor = net > 0 ? colors.income : net < 0 ? colors.expense : colors.textSecondary;

  const usagePercent = budget.hasBudget ? Math.round(budget.usage * 100) : 0;
  const barColor = budget.overBudget ? colors.expense : usagePercent > 75 ? colors.warning : colors.primary;

  return (
    <Card>
      <View style={styles.netRow}>
        <View>
          <Text variant="label" color={colors.textSecondary}>
            Net durum
          </Text>
          <View style={styles.netValue}>
            <NetIcon size={22} color={netColor} />
            <Text variant="display" color={netColor} tabular style={styles.netAmount}>
              {formatMinor(net, currency)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.split}>
        <View style={styles.splitItem}>
          <View style={[styles.dot, { backgroundColor: colors.income }]} />
          <View>
            <Text variant="caption" color={colors.textMuted}>
              Gelir
            </Text>
            <AmountText minor={income} currency={currency} tone="income" />
          </View>
        </View>
        <View style={styles.splitItem}>
          <View style={[styles.dot, { backgroundColor: colors.expense }]} />
          <View>
            <Text variant="caption" color={colors.textMuted}>
              Gider
            </Text>
            <AmountText minor={expense} currency={currency} tone="expense" />
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.budgetHeader}>
        <Text variant="label" color={colors.textSecondary}>
          Aylık bütçe
        </Text>
        {budget.hasBudget ? (
          <Text variant="label" color={barColor}>
            %{usagePercent}
          </Text>
        ) : (
          <Text variant="caption" color={colors.textMuted}>
            Belirlenmedi
          </Text>
        )}
      </View>

      {budget.hasBudget ? (
        <>
          <ProgressBar progress={budget.usage} color={barColor} style={styles.bar} />
          <View style={styles.budgetFooter}>
            <Text variant="caption" color={colors.textMuted}>
              {formatMinor(budget.spentMinor, currency)} harcandı
            </Text>
            <Text
              variant="caption"
              color={budget.overBudget ? colors.expense : colors.textSecondary}
            >
              {budget.overBudget
                ? `${formatMinor(Math.abs(budget.remainingMinor), currency)} aşıldı`
                : `${formatMinor(budget.remainingMinor, currency)} kaldı`}
            </Text>
          </View>
        </>
      ) : (
        <Text variant="caption" color={colors.textMuted} style={styles.budgetHint}>
          Finans ekranından aylık bütçe belirleyebilirsiniz.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  netRow: { marginBottom: spacing.lg },
  netValue: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.xs },
  netAmount: { letterSpacing: -1 },
  split: { flexDirection: 'row', gap: spacing.lg },
  splitItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { marginTop: spacing.sm },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  budgetHint: { marginTop: spacing.sm },
});
