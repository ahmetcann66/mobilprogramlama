import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash } from 'lucide-react-native';
import { paymentsFor } from '@/services/debts/debts';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, iconSize, spacing } from '@/theme';
import { createId } from '@/utils/id';
import { formatMinor } from '@/utils/money';
import { nowIso } from '@/utils/date';
import { parseAmountInput, validateName } from '@/utils/validation';
import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/FormScreen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

/** Borç (faizli kredi) ekleme/düzenleme formu. */
export default function DebtFormScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, dispatch } = useAppData();
  const haptics = useHaptics();

  const editing = id !== undefined ? data.debts.find((debt) => debt.id === id) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [balance, setBalance] = useState(
    editing !== undefined ? (editing.balanceMinor / 100).toString().replace('.', ',') : '',
  );
  const [rate, setRate] = useState(
    editing !== undefined && editing.monthlyRate > 0
      ? (editing.monthlyRate * 100).toString().replace('.', ',')
      : '',
  );
  const [payment, setPayment] = useState(
    editing !== undefined && editing.paymentMinor > 0
      ? (editing.paymentMinor / 100).toString().replace('.', ',')
      : '',
  );
  const [note, setNote] = useState(editing?.note ?? '');

  const [nameError, setNameError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const existingPaidMinor =
    editing !== undefined
      ? paymentsFor(data.debtPayments, editing.id).reduce((sum, payment) => sum + payment.amountMinor, 0)
      : 0;

  const submit = (): void => {
    if (submitting) return;
    setNameError(validateName(name, 'Borç adı'));
    if (name.trim() === '') return;

    const balanceResult = parseAmountInput(balance);
    if (!balanceResult.ok) {
      setBalanceError(
        balanceResult.error === 'Tutar sıfırdan büyük olmalı'
          ? 'Bakiye sıfırdan büyük olmalı'
          : balanceResult.error,
      );
      return;
    }
    if (existingPaidMinor > 0 && balanceResult.minor < existingPaidMinor) {
      setBalanceError(`Yapılan ödemelerin toplamı (${formatMinor(existingPaidMinor, data.preferences.currency)}) bakiye kadar olabilir`);
      return;
    }

    const parsedRate = rate.trim() === '' ? 0 : Number.parseFloat(rate.replace(',', '.'));
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      setRateError('Aylık faiz yüzdesi geçersiz (örn. 2)');
      return;
    }

    let paymentMinor = 0;
    if (payment.trim() !== '') {
      const paymentResult = parseAmountInput(payment);
      if (!paymentResult.ok) {
        setPaymentError('Geçerli bir aylık ödeme girin');
        return;
      }
      paymentMinor = paymentResult.minor;
    }

    setSubmitting(true);
    try {
      const patch = {
        name: name.trim(),
        balanceMinor: balanceResult.minor,
        monthlyRate: parsedRate / 100,
        paymentMinor,
        note: note.trim() !== '' ? note.trim() : undefined,
      };
      if (editing !== undefined) {
        dispatch({ type: 'update-debt', id: editing.id, patch });
        haptics.light();
      } else {
        dispatch({
          type: 'add-debt',
          debt: {
            id: createId('debt'),
            name: patch.name,
            balanceMinor: patch.balanceMinor,
            monthlyRate: patch.monthlyRate,
            paymentMinor: patch.paymentMinor,
            archived: false,
            createdAt: nowIso(),
            ...(patch.note !== undefined ? { note: patch.note } : {}),
          },
        });
        haptics.success();
      }
      router.back();
    } catch {
      setSubmitting(false);
      Alert.alert('Kaydedilemedi', 'Borç kaydedilirken bir sorun oluştu.');
    }
  };

  const confirmDelete = (): void => {
    if (editing === undefined) return;
    Alert.alert('Borcu sil', `${editing.name} borcu ve ödemeleri silinecek. Bu işlem geri alınamaz.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'delete-debt', id: editing.id });
          haptics.warning();
          router.back();
        },
      },
    ]);
  };

  return (
    <FormScreen
      title={editing !== undefined ? 'Borcu düzenle' : 'Yeni borç'}
      onClose={() => router.back()}
      footer={
        editing !== undefined ? (
          <View style={styles.editFooter}>
            <Button
              label="Sil"
              variant="danger"
              icon={<Trash size={iconSize.sm} color={colors.danger} />}
              onPress={confirmDelete}
              style={styles.deleteButton}
            />
            <Button label="Kaydet" onPress={submit} loading={submitting} style={styles.saveButton} />
          </View>
        ) : (
          <Button label="Kaydet" onPress={submit} loading={submitting} fullWidth />
        )
      }
    >
      <TextField
        label="Borç adı"
        value={name}
        onChangeText={setName}
        placeholder="örn. Kredi kartı, Araç kredisi"
        error={nameError}
        autoFocus
      />

      <TextField
        label="Kalan bakiye (₺)"
        value={balance}
        onChangeText={setBalance}
        placeholder="örn. 20000"
        keyboardType="decimal-pad"
        error={balanceError}
        style={styles.fields}
        helper={
          editing !== undefined && existingPaidMinor > 0
            ? `Bu tutar açılış bakiyesidir; şimdiye kadar ${formatMinor(existingPaidMinor, data.preferences.currency)} ödendi.`
            : 'Borcu kaydederkenki toplam kalan tutar.'
        }
      />

      <TextField
        label="Aylık faiz oranı (%) — isteğe bağlı"
        value={rate}
        onChangeText={setRate}
        placeholder="örn. 2 (aylık %2)"
        keyboardType="decimal-pad"
        error={rateError}
        style={styles.fields}
        helper="0 bırakabilirsin; faizsiz borç olarak hesaplanır."
      />

      <TextField
        label="Planlı aylık ödeme (₺) — isteğe bağlı"
        value={payment}
        onChangeText={setPayment}
        placeholder="örn. 1500"
        keyboardType="decimal-pad"
        error={paymentError}
        style={styles.fields}
        helper="Bu ödeme ile ne zaman kapanacağı hesaplanır."
      />

      <TextField
        label="Açıklama (isteğe bağlı)"
        value={note}
        onChangeText={setNote}
        placeholder="örn. Banka, ödeme günü, taksit notları"
        maxLength={160}
        multiline
        style={styles.fields}
      />

      <Text variant="caption" color={colors.textMuted} style={styles.note}>
        Not: Borç ödemeleri genel giderlerinize eklenmez; yalnızca kalan bakiyeyi azaltır. Ödeme eklerken
        istersen ayrıca bir gider işlemi de oluşturabilirsin.
      </Text>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  fields: { marginTop: spacing.lg },
  note: { marginTop: spacing.lg, lineHeight: 18 },
  editFooter: { flexDirection: 'row', gap: spacing.md },
  deleteButton: { flex: 1 },
  saveButton: { flex: 2 },
});