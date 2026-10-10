import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Archive, CalendarClock, Pencil, Plus, Trash } from 'lucide-react-native';
import type { Transaction } from '@/types';
import { paymentsFor } from '@/services/debts/debts';
import { payoffPlan } from '@/services/debts/payoff';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, iconSize, spacing } from '@/theme';
import { createId } from '@/utils/id';
import { formatDateTR, formatDateInput, nowIso, parseDateInput, todayKey } from '@/utils/date';
import { formatMinor } from '@/utils/money';
import { parseAmountInput } from '@/utils/validation';
import { AmountText } from '@/components/ui/AmountText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { FormScreen } from '@/components/ui/FormScreen';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

function payoffHeadline(
  months: number | null,
  endDate: string | null,
  settled: boolean,
): string {
  if (settled) return 'Borç kapatıldı';
  if (months !== null && endDate !== null) return `${months} ay sonra biter`;
  return 'Ödeme planı yok';
}

export default function DebtDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id, pay } = useLocalSearchParams<{ id: string; pay?: string }>();
  const { data, dispatch } = useAppData();
  const haptics = useHaptics();
  const currency = data.preferences.currency;
  const insets = useSafeAreaInsets();

  const [sheetOpen, setSheetOpen] = useState(pay === '1');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(formatDateInput(todayKey()));
  const [asExpense, setAsExpense] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const debt = data.debts.find((item) => item.id === id);
  const payments = useMemo(
    () => (debt !== undefined ? paymentsFor(data.debtPayments, debt.id) : []),
    [debt, data.debtPayments],
  );

  const plan = useMemo(
    () => (debt !== undefined ? payoffPlan(debt, data.debtPayments) : null),
    [debt, data.debtPayments],
  );

  const openSheet = (): void => {
    setAmount('');
    setDate(formatDateInput(todayKey()));
    setAsExpense(false);
    setAmountError(null);
    setDateError(null);
    setSheetOpen(true);
  };

  const submitPayment = (): void => {
    if (debt === undefined) return;
    const parsed = parseAmountInput(amount);
    if (!parsed.ok) {
      setAmountError(parsed.error);
      return;
    }
    const dateKey = parseDateInput(date);
    if (dateKey === null) {
      setDateError('Geçerli bir tarih girin (GG.AA.YYYY)');
      return;
    }

    let transaction: Transaction | undefined;
    if (asExpense) {
      transaction = {
        id: createId('tx'),
        type: 'expense',
        amount: parsed.minor,
        categoryId: 'credit',
        date: dateKey,
        createdAt: nowIso(),
        note: `Borç ödemesi: ${debt.name}`,
      };
    }

    dispatch({
      type: 'add-debt-payment',
      payment: {
        id: createId('pay'),
        debtId: debt.id,
        amountMinor: parsed.minor,
        date: dateKey,
        createdAt: nowIso(),
        ...(transaction !== undefined ? { transactionId: transaction.id } : {}),
      },
      transaction,
    });
    haptics.success();
    setSheetOpen(false);
  };

  const confirmRemove = (paymentId: string, amountLabel: string): void => {
    Alert.alert(
      'Ödemeyi geri al',
      `${amountLabel} tutarındaki ödeme geri alınamaz biçimde silinecek. Bağlı bir gider işlemi de kaldırılır. Devam edilsin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Geri al',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'remove-debt-payment', id: paymentId });
            haptics.warning();
          },
        },
      ],
    );
  };

  const toggleArchived = (): void => {
    if (debt === undefined) return;
    dispatch({ type: 'toggle-debt-archived', id: debt.id });
    haptics.light();
    router.back();
  };

  if (debt === undefined || plan === null) {
    return (
      <FormScreen title="Borç" onClose={() => router.back()}>
        <Text variant="body" color={colors.textSecondary}>
          Borç bulunamadı.
        </Text>
      </FormScreen>
    );
  }

  const balanceMinor = Math.max(0, debt.balanceMinor - payments.reduce((sum, p) => sum + p.amountMinor, 0));

  return (
    <FormScreen
      title={debt.name}
      onClose={() => router.back()}
      footer={
        !debt.archived ? (
          <Button
            label="Ödeme ekle"
            icon={<Plus size={iconSize.sm} color={colors.textInverse} />}
            onPress={openSheet}
            fullWidth
          />
        ) : undefined
      }
    >
      {/* Ne zaman biter? özeti */}
      <Card style={styles.planCard}>
        <View style={styles.planTop}>
          <View style={styles.planMeta}>
            {debt.archived || plan.settled ? (
              <Badge label={debt.archived ? 'Kapalı' : 'Ödendi'} tone="success" style={styles.statusBadge} />
            ) : null}
            <Text variant="caption" color={colors.textMuted}>
              Kalan bakiye
            </Text>
            <AmountText minor={balanceMinor} currency={currency} variant="h1" tone="expense" />
          </View>

          <View style={styles.planFacts}>
            <View style={styles.factRow}>
              <Text variant="caption" color={colors.textMuted}>
                Planlı aylık ödeme
              </Text>
              <AmountText minor={debt.paymentMinor} currency={currency} variant="bodyStrong" />
            </View>
            <View style={styles.factRow}>
              <Text variant="caption" color={colors.textMuted}>
                Aylık faiz
              </Text>
              <Text variant="bodyStrong">
                %{Math.round(debt.monthlyRate * 1000) / 10}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.payoffBanner}>
          <CalendarClock size={16} color={plan.payable ? colors.primary : colors.textMuted} />
          <Text variant="bodyStrong" color={plan.payable ? colors.primary : colors.textMuted}>
            {payoffHeadline(plan.months, plan.endDate, plan.settled)}
          </Text>
        </View>
        {plan.endDate !== null ? (
          <Text variant="caption" color={colors.textMuted} style={styles.payoffDetail}>
            {formatDateTR(plan.endDate)} itibarıyla kapatılması planlanıyor.
          </Text>
        ) : null}

        {plan.settled || debt.archived ? null : (
          <Divider style={styles.planDivider} />
        )}

        {!debt.archived && !plan.settled ? (
          <View style={styles.interestRow}>
            <Text variant="caption" color={colors.textMuted}>
              Tahmini toplam ödeme
            </Text>
            <AmountText minor={plan.totalPaymentMinor} currency={currency} variant="bodyStrong" />
            <Text variant="caption" color={colors.warning}>
              +{formatMinor(plan.totalInterestMinor, currency)} faiz
            </Text>
          </View>
        ) : null}

        {!plan.payable && !plan.settled && !debt.archived ? (
          <Text variant="caption" color={colors.warning} style={styles.warning}>
            {debt.paymentMinor > 0
              ? 'Aylık ödemen aylık faizi karşılamıyor; bu planda borç kapanmaz.'
              : 'Bitiş tahmini için planlı bir aylık ödeme belirle.'}
          </Text>
        ) : null}

        {debt.note !== undefined ? (
          <Text variant="body" color={colors.textSecondary} style={styles.note}>
            {debt.note}
          </Text>
        ) : null}
      </Card>

      {/* Ödeme geçmişi */}
      <View style={styles.sectionHeader}>
        <Text variant="h3">Ödeme geçmişi</Text>
        <Text variant="caption" color={colors.textMuted}>
          {payments.length} kayıt
        </Text>
      </View>

      <Card>
        {payments.length === 0 ? (
          <Text variant="body" color={colors.textSecondary} style={styles.noPayments}>
            Henüz ödeme eklenmemiş. &apos;+ Ödeme ekle&apos; ile kalan bakiyeni azaltabilirsin.
          </Text>
        ) : (
          payments.map((payment, index) => (
            <View key={payment.id}>
              {index > 0 ? <Divider /> : null}
              <View style={styles.paymentRow}>
                <View style={styles.paymentMeta}>
                  <Text variant="bodyStrong">{formatDateTR(payment.date)}</Text>
                  <AmountText minor={payment.amountMinor} currency={currency} tone="income" signed />
                </View>
                {payment.transactionId !== undefined ? (
                  <Badge label="Gider" tone="neutral" />
                ) : null}
                <PressableScale
                  onPress={() =>
                    confirmRemove(payment.id, formatMinor(payment.amountMinor, currency))
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Ödemeyi geri al"
                  style={styles.removeButton}
                >
                  <Trash size={iconSize.sm} color={colors.danger} />
                </PressableScale>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Yönetim */}
      <View style={styles.actionsRow}>
        <Button
          label="Düzenle"
          variant="secondary"
          icon={<Pencil size={iconSize.sm} color={colors.text} />}
          onPress={() => router.push({ pathname: '/debt-form', params: { id: debt.id } })}
          style={styles.actionButton}
        />
        {!debt.archived ? (
          <Button
            label="Kapat"
            variant="ghost"
            icon={<Archive size={iconSize.sm} color={colors.warning} />}
            onPress={toggleArchived}
            style={styles.actionButton}
          />
        ) : (
          <Button
            label="Yeniden aç"
            variant="ghost"
            onPress={() => {
              dispatch({ type: 'toggle-debt-archived', id: debt.id });
              haptics.light();
              router.back();
            }}
            style={styles.actionButton}
          />
        )}
      </View>

      {/* Ödeme ekleme sheet */}
      <Modal
        visible={sheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKav}
          >
            <View style={[styles.modalCard, { paddingBottom: spacing.xxxl + insets.bottom }]}>
              <Text variant="h3" style={styles.modalTitle}>
                Ödeme ekle
              </Text>
            <TextField
              label="Tutar (₺)"
              value={amount}
              onChangeText={setAmount}
              placeholder="örn. 1500"
              keyboardType="numeric"
              error={amountError}
              autoFocus
            />
            <TextField
              label="Tarih (GG.AA.YYYY)"
              value={date}
              onChangeText={setDate}
              placeholder="GG.AA.YYYY"
              error={dateError}
              helper={`Bugün: ${formatDateTR(todayKey())}`}
              style={styles.dateField}
            />
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text variant="bodyStrong">Ayrıca gider işlemi olarak kaydet</Text>
                <Text variant="caption" color={colors.textMuted}>
                  Ödeme, genel gider toplamlarına da eklenir.
                </Text>
              </View>
              <Switch
                value={asExpense}
                onValueChange={setAsExpense}
                trackColor={{ false: colors.surfaceHighlight, true: colors.primarySoft }}
                thumbColor={asExpense ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={styles.modalActions}>
              <Button label="Vazgeç" variant="secondary" onPress={() => setSheetOpen(false)} style={styles.actionButton} />
              <Button label="Ekle" onPress={submitPayment} style={styles.actionButton} />
            </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  planCard: { marginBottom: spacing.xl },
  planTop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.lg },
  planMeta: { flex: 1, alignItems: 'flex-start', minWidth: 160 },
  statusBadge: { marginBottom: spacing.sm },
  planFacts: { alignItems: 'flex-end', justifyContent: 'flex-start', gap: spacing.sm },
  factRow: { alignItems: 'flex-end' },
  payoffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  payoffDetail: { marginTop: spacing.sm },
  planDivider: { marginTop: spacing.lg },
  interestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  warning: { marginTop: spacing.md, lineHeight: 18 },
  note: { marginTop: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  noPayments: { paddingVertical: spacing.md },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  paymentMeta: { flex: 1, gap: spacing.xxs },
  removeButton: { padding: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  actionButton: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalKav: { justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  modalTitle: { marginBottom: spacing.lg },
  dateField: { marginTop: spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  switchText: { flex: 1, gap: 2 },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});