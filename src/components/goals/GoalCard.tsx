import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarClock, CheckCircle2, PiggyBank, Target } from 'lucide-react-native';
import type { SavingsGoal } from '@/types';
import type { GoalProgress } from '@/services/goals/goals';
import { colors, spacing } from '@/theme';
import { formatDateTR } from '@/utils/date';
import { AmountText } from '@/components/ui/AmountText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';

export interface GoalCardProps {
  readonly goal: SavingsGoal;
  readonly progress: GoalProgress;
  readonly currency?: string;
  readonly onPress?: (goal: SavingsGoal) => void;
}

/** Tasarruf hedefi kartı: ilerleme çubuğu, kaydedilen/hedef tutar ve durum. */
export function GoalCard({
  goal,
  progress,
  currency = 'TRY',
  onPress,
}: GoalCardProps): React.JSX.Element {
  const barColor = progress.reached ? colors.secondary : colors.primary;

  return (
    <Card onPress={onPress !== undefined ? () => onPress(goal) : undefined} accessibilityLabel={goal.name}>
      <View style={styles.header}>
        <IconBadge backgroundColor={progress.reached ? colors.secondarySoft : colors.primarySoft} size={42}>
          {progress.reached ? (
            <CheckCircle2 size={20} color={colors.secondary} />
          ) : (
            <Target size={20} color={colors.primary} />
          )}
        </IconBadge>
        <View style={styles.titleWrap}>
          <Text variant="title" numberOfLines={1}>
            {goal.name}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            %{progress.percent} tamamlandı
          </Text>
        </View>
        {progress.reached ? <Badge label="Tamamlandı" tone="success" /> : null}
      </View>

      {goal.roundUpEnabled === true ? (
        <View style={styles.kumbaraRow}>
          <PiggyBank size={13} color={colors.secondary} />
          <Text variant="caption" color={colors.secondary}>
            Kumbara açık — giderlerinizin bozuk parası bu hedefe birikiyor.
          </Text>
        </View>
      ) : null}

      <ProgressBar progress={progress.ratio} color={barColor} style={styles.bar} />

      <View style={styles.amounts}>
        <View>
          <Text variant="caption" color={colors.textMuted}>
            Biriken
          </Text>
          <AmountText minor={progress.savedMinor} currency={currency} variant="bodyStrong" />
        </View>
        <View style={styles.alignEnd}>
          <Text variant="caption" color={colors.textMuted}>
            Hedef
          </Text>
          <AmountText minor={progress.targetMinor} currency={currency} variant="bodyStrong" />
        </View>
      </View>

      <View style={styles.footer}>
        {progress.reached ? (
          <Text variant="caption" color={colors.secondary}>
            Hedefe ulaşıldı
          </Text>
        ) : (
          <View style={styles.remaining}>
            <Text variant="caption" color={colors.textMuted}>
              Kalan{' '}
            </Text>
            <AmountText minor={progress.remainingMinor} currency={currency} variant="caption" />
          </View>
        )}
        {goal.deadline !== undefined ? (
          <View style={styles.deadline}>
            <CalendarClock size={13} color={colors.textMuted} />
            <Text variant="caption" color={colors.textMuted}>
              {formatDateTR(goal.deadline)}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleWrap: { flex: 1 },
  kumbaraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
  },
  bar: { marginTop: spacing.lg },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  alignEnd: { alignItems: 'flex-end' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  remaining: { flexDirection: 'row', alignItems: 'center' },
  deadline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
