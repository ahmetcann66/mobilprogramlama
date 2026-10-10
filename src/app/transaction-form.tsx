import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash } from 'lucide-react-native';
import type { Budget, Transaction, TransactionType } from '@/types';
import { categoriesForType, getCategoryOrDefault } from '@/constants/categories';
import { computeBudgetUsage } from '@/services/finance/budget';
import { sumByCategory } from '@/services/finance/transactions';
import { piggyBankGoal, roundUpMinor } from '@/services/goals/goals';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, iconSize, spacing } from '@/theme';
import { createId } from '@/utils/id';
import { formatDateInput, nowIso, parseDateInput, parseDateKey, rangeForPreset, todayKey } from '@/utils/date';
import { formatMinor } from '@/utils/money';
import { parseAmountInput } from '@/utils/validation';
import { deepEqual } from '@/utils/equality';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { FormScreen } from '@/components/ui/FormScreen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

/** Gelir/gider ekleme ve düzenleme formu (modal). */
export default function TransactionFormScreen(): React.JSX.Element {
  const router = useRouter();
  const { id, type: typeParam } = useLocalSearchParams<{ id?: string; type?: string }>();
  const { data, dispatch } = useAppData();
  const haptics = useHaptics();

  const editingTransaction = id !== undefined ? data.transactions.find((tx) => tx.id === id) : undefined;

  const [txType, setTxType] = useState<TransactionType>(
    editingTransaction?.type ?? (typeParam === 'income' ? 'income' : 'expense'),
  );
  const [amount, setAmount] = useState(
    editingTransaction !== undefined ? (editingTransaction.amount / 100).toString().replace('.', ',') : '',
  );
  const [categoryId, setCategoryId] = useState(editingTransaction?.categoryId ?? '');
  const [note, setNote] = useState(editingTransaction?.note ?? '');
  const [date, setDate] = useState(
    editingTransaction !== undefined ? formatDateInput(editingTransaction.date) : formatDateInput(todayKey()),
  );

  const [amountError, setAmountError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = categoriesForType(txType);

  // --- Değer eşitliği: düzenleme modunda "hiçbir şey değişmediyse" kaydet
  // butonunu pasifleştirmek için taslak ve orijinal pencere değerlerini
  // içerik olarak (referans değil) karşılaştırırız.
  const parsedAmount = useMemo(() => parseAmountInput(amount), [amount]);

  const draft = useMemo(() => {
    if (!parsedAmount.ok) return null;
    const dateKey = parseDateInput(date);
    if (dateKey === null) return null;
    return {
      type: txType,
      amount: parsedAmount.minor,
      categoryId,
      date: dateKey,
      note: note.trim(),
    };
  }, [parsedAmount, txType, categoryId, date, note]);

  const original = useMemo(() => {
    if (editingTransaction === undefined) return null;
    return {
      type: editingTransaction.type,
      amount: editingTransaction.amount,
      categoryId: editingTransaction.categoryId,
      date: editingTransaction.date,
      note: editingTransaction.note ?? '',
    };
  }, [editingTransaction]);

  const unchanged = original !== null && draft !== null && deepEqual(draft, original);

  // Kumbara: aktif bir hedef "bozuk para biriktir" işaretliyse giderin
  // 1 TL'ye tamamlayan farkı otomatik o hedefe birikir.
  const piggyGoal = useMemo(() => piggyBankGoal(data.goals), [data.goals]);
  const roundUp = useMemo(
    () =>
      txType === 'expense' && parsedAmount.ok && piggyGoal !== undefined
        ? roundUpMinor(parsedAmount.minor)
        : 0,
    [txType, parsedAmount, piggyGoal],
  );

  const submit = (): void => {
    if (submitting) return; // çift gönderim koruması
    setAmountError(null);
    setCategoryError(null);
    setDateError(null);

    const amountResult = parseAmountInput(amount);
    if (!amountResult.ok) {
      setAmountError(amountResult.error);
      return;
    }
    if (categoryId === '') {
      setCategoryError('Bir kategori seçin');
      return;
    }
    const dateKey = parseDateInput(date);
    if (dateKey === null) {
      setDateError('Geçerli bir tarih girin (GG.AA.YYYY)');
      return;
    }

    setSubmitting(true);
    try {
      // İşlem kaydedilmeden önce bu işlemin kategori/toplam bütçe limitlerini
      // geçip geçmeyeceğini kontrol et; yeni geçilen limitler için kullanıcıyı uyar.
      const warnings = buildBudgetWarnings({
        transactions: data.transactions,
        budget: data.budget,
        editing: editingTransaction,
        next: { type: txType, amount: amountResult.minor, categoryId, date: dateKey },
      });

      if (warnings.length > 0) {
        haptics.warning();
        Alert.alert(
          'Bütçe uyarısı',
          `${warnings.join('\n')}\n\nYine de kaydetmek istiyor musun?`,
          [
            { text: 'Vazgeç', style: 'cancel', onPress: () => setSubmitting(false) },
            { text: 'Yine de kaydet', onPress: () => commit(amountResult.minor, categoryId, dateKey) },
          ],
        );
        return;
      }
      commit(amountResult.minor, categoryId, dateKey);
    } catch {
      setSubmitting(false);
      // İşlem bellekte başarısız olursa kullanıcıya anlaşılır geri bildirim ver.
      Alert.alert('Kaydedilemedi', 'İşlem kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  const commit = (minor: number, categoryIdValue: string, dateKeyValue: string): void => {
    try {
      const noteValue = note.trim() !== '' ? note.trim() : undefined;
      if (editingTransaction !== undefined) {
        // Düzenlemede önceki kumbara katkısı varsa kaldır; yeni tutara göre yeniden hesapla.
        removeLinkedRoundUps(editingTransaction.id);
        dispatch({
          type: 'update-transaction',
          id: editingTransaction.id,
          patch: {
            type: txType,
            amount: minor,
            categoryId: categoryIdValue,
            date: dateKeyValue,
            ...(noteValue !== undefined ? { note: noteValue } : {}),
          },
        });
        if (txType === 'expense' && piggyGoal !== undefined && roundUp > 0) {
          dispatch({
            type: 'add-contribution',
            contribution: {
              id: createId('ctb'),
              goalId: piggyGoal.id,
              amountMinor: roundUp,
              date: dateKeyValue,
              createdAt: nowIso(),
              transactionId: editingTransaction.id,
            },
          });
        }
        haptics.light();
      } else {
        const newId = createId('tx');
        dispatch({
          type: 'add-transaction',
          transaction: {
            id: newId,
            type: txType,
            amount: minor,
            categoryId: categoryIdValue,
            date: dateKeyValue,
            createdAt: nowIso(),
            ...(noteValue !== undefined ? { note: noteValue } : {}),
          },
        });
        if (txType === 'expense' && piggyGoal !== undefined && roundUp > 0) {
          dispatch({
            type: 'add-contribution',
            contribution: {
              id: createId('ctb'),
              goalId: piggyGoal.id,
              amountMinor: roundUp,
              date: dateKeyValue,
              createdAt: nowIso(),
              transactionId: newId,
            },
          });
        }
        if (roundUp > 0) haptics.success();
      }
      router.back();
    } catch {
      setSubmitting(false);
      Alert.alert('Kaydedilemedi', 'İşlem kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  const removeLinkedRoundUps = (transactionId: string): void => {
    for (const contribution of data.contributions) {
      if (contribution.transactionId === transactionId) {
        dispatch({ type: 'remove-contribution', id: contribution.id });
      }
    }
  };

  const confirmDelete = (): void => {
    if (editingTransaction === undefined) return;
    Alert.alert(
      'İşlemi sil',
      'Bu işlem geri alınamaz biçimde silinecek. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            removeLinkedRoundUps(editingTransaction.id);
            dispatch({ type: 'delete-transaction', id: editingTransaction.id });
            haptics.warning();
            router.back();
          },
        },
      ],
    );
  };

  const typeOptions = [
    { value: 'expense' as const, label: 'Gider' },
    { value: 'income' as const, label: 'Gelir' },
  ];

  return (
    <FormScreen
      title={editingTransaction !== undefined ? 'İşlemi düzenle' : 'İşlem ekle'}
      onClose={() => router.back()}
      footer={
        editingTransaction !== undefined ? (
          <View style={styles.editFooter}>
            <Button
              label="Sil"
              variant="danger"
              icon={<Trash size={iconSize.sm} color={colors.danger} />}
              onPress={confirmDelete}
              style={styles.deleteButton}
            />
            <Button
              label="Kaydet"
              onPress={submit}
              loading={submitting}
              disabled={unchanged}
              style={styles.saveButton}
            />
          </View>
        ) : (
          <Button label="Kaydet" onPress={submit} loading={submitting} fullWidth />
        )
      }
    >
      <Text variant="label" color={colors.textSecondary} style={styles.fieldLabel}>
        Tür
      </Text>
      <SegmentedControl
        options={typeOptions}
        value={txType}
        onChange={(value) => {
          setTxType(value);
          setCategoryId('');
        }}
      />

      <TextField
        label="Tutar (₺)"
        value={amount}
        onChangeText={setAmount}
        placeholder="örn. 1250,50"
        keyboardType="decimal-pad"
        error={amountError}
        style={styles.fields}
        autoFocus
      />

      <Text variant="label" color={colors.textSecondary} style={styles.fieldLabel}>
        Kategori
      </Text>
      <View style={styles.categories}>
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            icon={
              <View style={[styles.dot, { backgroundColor: category.color }]} />
            }
            selected={categoryId === category.id}
            onPress={() => setCategoryId(category.id)}
            accent={category.color}
          />
        ))}
      </View>
      {categoryError !== null ? (
        <Text variant="caption" color={colors.danger} style={styles.errorText}>
          {categoryError}
        </Text>
      ) : null}

      <TextField
        label="Tarih (GG.AA.YYYY)"
        value={date}
        onChangeText={setDate}
        placeholder="GG.AA.YYYY"
        error={dateError}
        style={styles.fields}
        helper={`Bugün: ${formatDateInput(todayKey())}`}
      />

      <TextField
        label="Açıklama (isteğe bağlı)"
        value={note}
        onChangeText={setNote}
        placeholder="örn. Haftalık market alışverişi"
        maxLength={120}
        style={styles.fields}
      />

      {piggyGoal !== undefined && roundUp > 0 ? (
        <Text variant="caption" color={colors.primary} style={styles.kumbaraNote}>
          Kumbara: Bu giderin {formatMinor(roundUp, data.preferences.currency)} bozuk parası
          &quot;{piggyGoal.name}&quot; hedefine otomatik birikecektir.
        </Text>
      ) : null}
    </FormScreen>
  );
}

interface BudgetWarningInput {
  readonly transactions: readonly Transaction[];
  readonly budget: Budget;
  readonly editing: Transaction | undefined;
  readonly next: { readonly type: TransactionType; readonly amount: number; readonly categoryId: string; readonly date: string };
}

/**
 * Yeni/düzenlenen işlemle birlikte hangi kategori limitinin (veya toplam
 * bütçenin) aşılacağını bulur. Yalnızca bu işlemle YENİDEN aşılan limitler
 * uyarı üretir; hali hazırda aşılmış olanlar tekrar tekrar uyarmaz.
 */
function buildBudgetWarnings({ transactions, budget, editing, next }: BudgetWarningInput): string[] {
  if (next.type !== 'expense') return [];

  const monthRange = rangeForPreset('thisMonth', parseDateKey(next.date));
  const beforeTransactions = editing !== undefined ? transactions.filter((tx) => tx.id !== editing.id) : transactions;
  const nextTx: Transaction = { id: editing?.id ?? '__next__', createdAt: '1970-01-01T00:00:00.000Z', ...next };
  const afterTransactions = [nextTx, ...beforeTransactions];

  const warnings: string[] = [];

  for (const [categoryId, limit] of Object.entries(budget.categoryLimits)) {
    if (limit <= 0) continue;
    const beforeSpent = sumByCategory(beforeTransactions, 'expense', monthRange)[categoryId] ?? 0;
    const afterSpent = sumByCategory(afterTransactions, 'expense', monthRange)[categoryId] ?? 0;
    if (beforeSpent <= limit && afterSpent > limit) {
      const category = getCategoryOrDefault(categoryId);
      warnings.push(`${category.name} limiti aşılacak: ${formatMinor(afterSpent - limit)} üzeri.`);
    }
  }

  const beforeUsage = computeBudgetUsage(budget, beforeTransactions, monthRange);
  const afterUsage = computeBudgetUsage(budget, afterTransactions, monthRange);
  if (!beforeUsage.overBudget && afterUsage.overBudget && afterUsage.hasBudget) {
    warnings.push(`Aylık toplam bütçe aşılacak: ${formatMinor(-afterUsage.remainingMinor)} üzeri.`);
  }

  return warnings;
}

const styles = StyleSheet.create({
  fieldLabel: { marginBottom: spacing.sm },
  fields: { marginTop: spacing.lg },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  errorText: { marginTop: spacing.sm },
  kumbaraNote: { marginTop: spacing.lg },
  editFooter: { flexDirection: 'row', gap: spacing.md },
  deleteButton: { flex: 1 },
  saveButton: { flex: 2 },
});