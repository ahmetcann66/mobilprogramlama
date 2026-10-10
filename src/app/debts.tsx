import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CreditCard } from 'lucide-react-native';
import { paymentsFor, summarizeDebts } from '@/services/debts/debts';
import { useAppData } from '@/store/AppDataContext';
import { colors, spacing } from '@/theme';
import { AmountText } from '@/components/ui/AmountText';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { Screen } from '@/components/ui/Screen';
import { StackHeader } from '@/components/ui/StackHeader';
import { Text } from '@/components/ui/Text';
import { DebtCard } from '@/components/debts/DebtCard';

/** Borç listesi: kendine ne zaman kapanacağını söyleyen planlı ödeme özeti. */
export default function DebtsScreen(): React.JSX.Element {
  const router = useRouter();
  const { data } = useAppData();
  const currency = data.preferences.currency;

  const active = useMemo(
    () => data.debts.filter((debt) => !debt.archived),
    [data.debts],
  );
  const archived = useMemo(
    () => data.debts.filter((debt) => debt.archived),
    [data.debts],
  );

  const summary = useMemo(
    () => summarizeDebts(data.debts, data.debtPayments),
    [data.debts, data.debtPayments],
  );

  const allDebts = [...active, ...archived];

  if (allDebts.length === 0) {
    return (
      <Screen>
        <View style={styles.emptyPage}>
          <StackHeader title="Borçlar" subtitle="Kredi ve ödeme planların" />
          <EmptyState
            icon={CreditCard}
            title="Henüz borç kaydı yok"
            description="Kredi kartı borcunu veya bir kredini ekle; aylık ödemenle ne zaman kapanacağını hesaplayalım."
            actionLabel="Borç ekle"
            onAction={() => router.push('/debt-form')}
          />
        </View>
        <FAB onPress={() => router.push('/debt-form')} accessibilityLabel="Yeni borç ekle" />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={allDebts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <StackHeader title="Borçlar" subtitle="Kredi ve ödeme planların" />

            <Card style={styles.summary}>
              <View style={styles.summaryText}>
                <Text variant="caption" color={colors.textMuted}>
                  Toplam kalan bakiye
                </Text>
                <AmountText minor={summary.remainingTotalMinor} currency={currency} variant="h2" tone="expense" />
                <Text variant="caption" color={colors.textMuted}>
                  {summary.activeCount} aktif borç
                </Text>

                <Divider style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text variant="caption" color={colors.textMuted}>
                    Planlı aylık ödeme
                  </Text>
                  <AmountText minor={summary.paymentTotalMinor} currency={currency} variant="bodyStrong" />
                </View>
              </View>
            </Card>

            {active.length === 0 ? (
              <Text variant="caption" color={colors.textMuted} style={styles.noActive}>
                Aktif borç yok; aşağıda arşivlenen borçlar görünür.
              </Text>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View>
            {index > 0 ? <View style={styles.spacer} /> : null}
            <DebtCard
              debt={item}
              payments={paymentsFor(data.debtPayments, item.id)}
              currency={currency}
              onPress={(debt) => router.push({ pathname: '/debt-detail', params: { id: debt.id } })}
              onAddPayment={(debt) =>
                router.push({ pathname: '/debt-detail', params: { id: debt.id, pay: '1' } })
              }
            />
          </View>
        )}
        ListFooterComponent={
          archived.length > 0 ? (
            <View style={styles.footer}>
              <Divider style={styles.footerDivider} />
              <Text variant="caption" color={colors.textMuted} style={styles.footerText}>
                {archived.length} kapatılmış borç listeye dahil edilmedi.
              </Text>
            </View>
          ) : (
            <View style={styles.summarySpacer} />
          )
        }
      />
      <FAB onPress={() => router.push('/debt-form')} accessibilityLabel="Yeni borç ekle" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.huge + spacing.xxl },
  emptyPage: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  summary: { marginBottom: spacing.sm },
  summaryText: { gap: spacing.xs },
  summaryDivider: { marginVertical: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noActive: { marginTop: spacing.md },
  spacer: { height: spacing.lg },
  summarySpacer: { height: spacing.huge + spacing.xxl },
  footer: { marginTop: spacing.xxl },
  footerDivider: { marginBottom: spacing.md },
  footerText: { textAlign: 'center' },
});