import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { Transaction } from '@/types';
import { getCategoryOrDefault } from '@/constants/categories';
import { colors, iconSize, spacing } from '@/theme';
import { formatDateShortTR } from '@/utils/date';
import { AmountText } from '@/components/ui/AmountText';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { IconBadge } from '@/components/ui/IconBadge';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';

export interface TransactionRowProps {
  readonly transaction: Transaction;
  readonly currency?: string;
  readonly onPress?: (transaction: Transaction) => void;
}

/** Tek bir gelir/gider kaydını gösteren liste satırı. */
export function TransactionRow({
  transaction,
  currency = 'TRY',
  onPress,
}: TransactionRowProps): React.JSX.Element {
  const category = getCategoryOrDefault(transaction.categoryId);
  const isIncome = transaction.type === 'income';

  return (
    <PressableScale
      onPress={() => onPress?.(transaction)}
      disabled={onPress === undefined}
      accessibilityRole={onPress !== undefined ? 'button' : undefined}
      accessibilityLabel={`${category.name}, ${transaction.note ?? ''}`}
      style={styles.row}
    >
      <IconBadge backgroundColor={`${category.color}22`} size={44}>
        <CategoryIcon iconKey={category.icon} color={category.color} size={20} />
      </IconBadge>

      <View style={styles.middle}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {transaction.note !== undefined && transaction.note !== ''
            ? transaction.note
            : category.name}
        </Text>
        <Text variant="caption" color={colors.textMuted} numberOfLines={1}>
          {category.name} · {formatDateShortTR(transaction.date)}
        </Text>
      </View>

      <View style={styles.right}>
        <AmountText
          minor={transaction.amount}
          currency={currency}
          tone={isIncome ? 'income' : 'expense'}
          signed
          variant="bodyStrong"
        />
        {onPress !== undefined ? (
          <ChevronRight size={iconSize.sm} color={colors.textMuted} />
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  middle: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
