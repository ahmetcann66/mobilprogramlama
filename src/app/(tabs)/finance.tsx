import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Wallet, CreditCard, ChevronRight } from 'lucide-react-native';
import type { DateRange, Transaction, TransactionFilter, TransactionType } from '@/types';
import { DEFAULT_CATEGORIES, categoriesForType } from '@/constants/categories';
import { computeBudgetUsage } from '@/services/finance/budget';
import { summarizeDebts } from '@/services/debts/debts';
import {
  calculateExpenses,
  calculateIncome,
  filterTransactions,
  sortByDateDesc,
} from '@/services/finance/transactions';
import { useAppData } from '@/store/AppDataContext';
import { colors, iconSize, spacing } from '@/theme';
import { formatMinor } from '@/utils/money';
import { rangeForPreset } from '@/utils/date';
import { AmountText } from '@/components/ui/AmountText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { TransactionRow } from '@/components/finance/TransactionRow';

type RangeKey = 'all' | 'thisMonth' | 'lastMonth' | 'last3Months';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'thisMonth', label: 'Bu ay' },
  { value: 'lastMonth', label: 'Geçen ay' },
  { value: 'last3Months', label: 'Son 3 ay' },
];

const TYPE_OPTIONS: { value: TransactionType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'expense', label: 'Gider' },
  { value: 'income', label: 'Gelir' },
];

export default function FinanceScreen(): React.JSX.Element {
  const router = useRouter();
  const { data } = useAppData();
  const currency = data.preferences.currency;

  const [search, setSearch] = useState('');
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [rangeKey, setRangeKey] = useState<RangeKey>('thisMonth');

  const range: DateRange | null = useMemo(
    () => (rangeKey === 'all' ? null : rangeForPreset(rangeKey)),
    [rangeKey],
  );

  const filter: TransactionFilter = useMemo(
    () => ({ search, type, categoryId, range }),
    [search, type, categoryId, range],
  );

  const filtered = useMemo(
    () => sortByDateDesc(filterTransactions(data.transactions, filter)),
    [data.transactions, filter],
  );

  const totals = useMemo(() => {
    const inc = calculateIncome(data.transactions, range);
    const exp = calculateExpenses(data.transactions, range);
    return { inc, exp, net: inc - exp };
  }, [data.transactions, range]);

  const budget = useMemo(
    () => computeBudgetUsage(data.budget, data.transactions, rangeForPreset('thisMonth')),
    [data.budget, data.transactions],
  );

  const debtSummary = useMemo(
    () => summarizeDebts(data.debts, data.debtPayments),
    [data.debts, data.debtPayments],
  );

  const categoryOptions = useMemo(() => {
    const source = type === 'all' ? DEFAULT_CATEGORIES : categoriesForType(type);
    return [
      { value: 'all', label: 'Tüm kategoriler' },
      ...source.map((category) => ({ value: category.id, label: category.name })),
    ];
  }, [type]);

  const openEdit = (transaction: Transaction): void => {
    router.push({ pathname: '/transaction-form', params: { id: transaction.id } });
  };

  const usageColor = budget.overBudget
    ? colors.expense
    : budget.usage > 0.75
      ? colors.warning
      : colors.primary;

  const header = (
    <View>
      <ScreenHeader title="Finans" subtitle="Gelir, gider ve bütçe yönetimi" />

      <Card>
        <View style={styles.totalsRow}>
          <View style={styles.totalItem}>
            <Text variant="caption" color={colors.textMuted}>
              Gelir
            </Text>
            <AmountText minor={totals.inc} currency={currency} tone="income" />
          </View>
          <View style={styles.totalItem}>
            <Text variant="caption" color={colors.textMuted}>
              Gider
            </Text>
            <AmountText minor={totals.exp} currency={currency} tone="expense" />
          </View>
          <View style={styles.totalItem}>
            <Text variant="caption" color={colors.textMuted}>
              Net
            </Text>
            <AmountText
              minor={totals.net}
              currency={currency}
              tone={totals.net >= 0 ? 'income' : 'expense'}
            />
          </View>
        </View>

        <Divider style={styles.budgetDivider} />

        <View style={styles.budgetRow}>
          <Text variant="label" color={colors.textSecondary}>
            Aylık bütçe
          </Text>
          <Button
            label={budget.hasBudget ? 'Düzenle' : 'Belirle'}
            variant="ghost"
            size="sm"
            onPress={() => router.push('/budget-form')}
          />
        </View>

        {budget.hasBudget ? (
          <>
            <ProgressBar progress={budget.usage} color={usageColor} style={styles.bar} />
            <View style={styles.budgetFooter}>
              <Text variant="caption" color={colors.textMuted}>
                {formatMinor(budget.spentMinor, currency)} / {formatMinor(budget.totalMinor, currency)}
              </Text>
              <Text variant="caption" color={budget.overBudget ? colors.expense : colors.textSecondary}>
                {budget.overBudget
                  ? `${formatMinor(Math.abs(budget.remainingMinor), currency)} aşım`
                  : `${formatMinor(budget.remainingMinor, currency)} kaldı`}
              </Text>
            </View>
          </>
        ) : (
          <Text variant="caption" color={colors.textMuted} style={styles.budgetHint}>
            Bütçe belirlenmedi. Harcamalarınızı takip etmek için aylık bütçe belirleyin.
          </Text>
        )}
      </Card>

      <PressableScale
        onPress={() => router.push('/debts')}
        accessibilityRole="button"
        accessibilityLabel="Borçlarını yönet"
        style={styles.debtRow}
      >
        <View style={styles.debtIcon}>
          <CreditCard size={iconSize.sm} color={colors.warning} />
        </View>
        <View style={styles.debtText}>
          <Text variant="bodyStrong">Borçlar</Text>
          <Text variant="caption" color={colors.textMuted}>
            {debtSummary.activeCount > 0
              ? `${formatMinor(debtSummary.remainingTotalMinor, currency)} kalan bakiye`
              : 'Tanımlı aktif borç yok'}
          </Text>
        </View>
        <ChevronRight size={iconSize.sm} color={colors.textMuted} />
      </PressableScale>

      <View style={styles.filters}>
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Açıklamada ara"
          icon={<Wallet size={iconSize.sm} color={colors.textMuted} />}
        />

        <View style={styles.chipRow}>
          {TYPE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={type === option.value}
              onPress={() => setType(option.value)}
            />
          ))}
        </View>

        <View style={styles.chipRow}>
          {RANGE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={rangeKey === option.value}
              accent={colors.secondary}
              onPress={() => setRangeKey(option.value)}
            />
          ))}
        </View>

        <View style={styles.chipRow}>
          {categoryOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={categoryId === option.value}
              accent={colors.warning}
              onPress={() => setCategoryId(option.value)}
            />
          ))}
        </View>

        <View style={styles.listLabelRow}>
          <Text variant="label" color={colors.textSecondary}>
            {filtered.length} işlem
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View>
            <TransactionRow transaction={item} currency={currency} onPress={openEdit} />
            <Divider />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={Wallet}
            title="Kayıt bulunamadı"
            description={
              data.transactions.length === 0
                ? 'Henüz işlem eklenmedi. Sağ alttaki + düğmesiyle ilk gelirinizi veya giderinizi ekleyin.'
                : 'Seçilen filtrelere uygun işlem yok. Filtreleri değiştirmeyi deneyin.'
            }
            actionLabel={data.transactions.length === 0 ? 'İşlem ekle' : undefined}
            onAction={
              data.transactions.length === 0
                ? () => router.push({ pathname: '/transaction-form', params: { type: 'expense' } })
                : undefined
            }
          />
        }
        ListFooterComponent={<View style={styles.footerSpacer} />}
      />

      <FAB
        onPress={() => router.push({ pathname: '/transaction-form', params: { type: 'expense' } })}
        accessibilityLabel="Yeni işlem ekle"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.huge + spacing.xxl },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalItem: { flex: 1 },
  budgetDivider: { marginVertical: spacing.lg },
  budgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { marginTop: spacing.sm },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  budgetHint: { marginTop: spacing.sm },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  debtIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningSoft,
  },
  debtText: { flex: 1, gap: 2 },
  filters: { marginTop: spacing.xl, gap: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  listLabelRow: { marginTop: spacing.xs },
  footerSpacer: { height: spacing.huge },
});
