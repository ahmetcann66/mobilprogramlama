import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarClock, CreditCard, Plus } from 'lucide-react-native';
import type { Debt, DebtPayment } from '@/types';
import { currentBalanceMinor } from '@/services/debts/debts';
import type { PayoffPlan } from '@/services/debts/payoff';
import { payoffPlan } from '@/services/debts/payoff';
import { colors, iconSize, spacing } from '@/theme';
import { formatDateTR } from '@/utils/date';
import { AmountText } from '@/components/ui/AmountText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';

export interface DebtCardProps {
  readonly debt: Debt;
  readonly payments: readonly DebtPayment[];
  readonly currency?: string;
  readonly onPress?: (debt: Debt) => void;
  readonly onAddPayment?: (debt: Debt) => void;
}

function payoffLabel(plan: PayoffPlan): string {
  if (plan.settled) return 'Borç kapatıldı';
  if (plan.months !== null && plan.endDate !== null) {
    return `Kalan ${plan.months} ay (${formatDateTR(plan.endDate)})`;
  }
  return 'Ödeme planı yok';
}

function formatRate(monthlyRate: number): string {
  const percent = monthlyRate * 100;
  if (!Number.isFinite(percent)) return '0';
  if (Number.isInteger(percent)) return percent.toString();
  return (Math.round(percent * 10) / 10).toString();
}

/** Borç kartı: güncel bakiye, planlı kapanış bilgisi ve hızlı ödeme. */
export function DebtCard({
  debt,
  payments,
  currency = 'TRY',
  onPress,
  onAddPayment,
}: DebtCardProps): React.JSX.Element {
  const plan = payoffPlan(debt, payments);
  const balance = currentBalanceMinor(debt, payments);
  const settled = plan.settled;
  const archived = debt.archived;

  return (
    <Card onPress={onPress !== undefined ? () => onPress(debt) : undefined} accessibilityLabel={debt.name}>
      <View style={styles.header}>
        <IconBadge backgroundColor={archived ? colors.surfaceAlt : colors.warningSoft} size={42}>
          <CreditCard size={20} color={archived ? colors.textMuted : colors.warning} />
        </IconBadge>
        <View style={styles.titleWrap}>
          <Text variant="title" numberOfLines={1}>
            {debt.name}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Aylık %{formatRate(debt.monthlyRate)} faiz
          </Text>
        </View>
        {archived ? (
          <Badge label="Kapalı" tone="neutral" />
        ) : settled ? (
          <Badge label="Ödendi" tone="success" />
        ) : null}
      </View>

      <View style={styles.balanceRow}>
        <View>
          <Text variant="caption" color={colors.textMuted}>
            Kalan bakiye
          </Text>
          <AmountText minor={balance} currency={currency} variant="h2" tone="expense" />
        </View>
        {debt.paymentMinor > 0 && !archived ? (
          <View style={styles.alignEnd}>
            <Text variant="caption" color={colors.textMuted}>
              Planlı aylık ödeme
            </Text>
            <AmountText minor={debt.paymentMinor} currency={currency} variant="bodyStrong" />
          </View>
        ) : null}
      </View>

      {!archived ? (
        <View style={styles.footer}>
          <View style={styles.payoff}>
            <CalendarClock size={13} color={settled ? colors.secondary : colors.textMuted} />
            <Text variant="caption" color={settled ? colors.secondary : colors.textMuted}>
              {payoffLabel(plan)}
            </Text>
          </View>
          {onAddPayment !== undefined && !settled ? (
            <PressableScale
              onPress={() => onAddPayment(debt)}
              accessibilityRole="button"
              accessibilityLabel={`${debt.name} için ödeme ekle`}
              style={styles.addPayment}
            >
              <Plus size={iconSize.sm} color={colors.primary} />
              <Text variant="caption" color={colors.primary}>
                Ödeme
              </Text>
            </PressableScale>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleWrap: { flex: 1 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
  },
  alignEnd: { alignItems: 'flex-end' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  payoff: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  addPayment: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: spacing.xs },
});