import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import type { Budget } from '@/types';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing } from '@/theme';
import { parseAmountInput } from '@/utils/validation';
import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/FormScreen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

const LIMIT_CATEGORY_IDS = ['market', 'food', 'transport', 'bills', 'shopping', 'entertainment'] as const;

function minorToInput(minor: number): string {
  return minor > 0 ? (minor / 100).toString().replace('.', ',') : '';
}

/** Aylık bütçe ve kategori limitlerini düzenleme formu. */
export default function BudgetFormScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, dispatch } = useAppData();
  const haptics = useHaptics();

  const [total, setTotal] = useState(minorToInput(data.budget.monthlyTotalMinor));
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const categoryId of LIMIT_CATEGORY_IDS) {
      result[categoryId] = minorToInput(data.budget.categoryLimits[categoryId] ?? 0);
    }
    return result;
  });

  const [totalError, setTotalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setLimit = (categoryId: string, value: string): void => {
    setLimits((previous) => ({ ...previous, [categoryId]: value }));
  };

  const submit = (): void => {
    if (submitting) return;
    setTotalError(null);

    let monthlyTotalMinor = 0;
    if (total.trim() !== '') {
      const result = parseAmountInput(total);
      if (!result.ok) {
        setTotalError('Geçerli bir toplam bütçe girin');
        return;
      }
      monthlyTotalMinor = result.minor;
    }

    const categoryLimits: Record<string, number> = {};
    for (const categoryId of LIMIT_CATEGORY_IDS) {
      const raw = limits[categoryId] ?? '';
      if (raw.trim() === '') continue;
      const result = parseAmountInput(raw);
      if (!result.ok) {
        Alert.alert('Geçersiz limit', `${categoryLabel(categoryId)} limiti geçerli değil.`);
        return;
      }
      // Kategori limiti toplamı aşamaz.
      const capped = Math.min(result.minor, monthlyTotalMinor > 0 ? monthlyTotalMinor : result.minor);
      categoryLimits[categoryId] = capped;
    }

    const budget: Budget = { monthlyTotalMinor, categoryLimits };

    setSubmitting(true);
    try {
      dispatch({ type: 'set-budget', budget });
      haptics.success();
      router.back();
    } catch {
      setSubmitting(false);
      Alert.alert('Kaydedilemedi', 'Bütçe kaydedilirken bir sorun oluştu.');
    }
  };

  const clearBudget = (): void => {
    Alert.alert('Bütçeyi temizle', 'Aylık bütçe ve tüm kategori limitleri kaldırılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Temizle',
        style: 'destructive',
        onPress: () => {
          setTotal('');
          setLimits({});
          haptics.light();
        },
      },
    ]);
  };

  return (
    <FormScreen
      title="Aylık bütçe"
      onClose={() => router.back()}
      footer={
        <View style={styles.footerRow}>
          <Button label="Temizle" variant="danger" onPress={clearBudget} style={styles.clearButton} />
          <Button label="Kaydet" onPress={submit} loading={submitting} style={styles.saveButton} />
        </View>
      }
    >
      <Text variant="body" color={colors.textSecondary} style={styles.intro}>
        Aylık toplam bütçe belirleyin; isterseniz kategorilere ayrı limitler tanımlayın. Boş bırakılan
        alanlar için limit uygulanmaz.
      </Text>

      <TextField
        label="Aylık toplam bütçe (₺)"
        value={total}
        onChangeText={setTotal}
        placeholder="örn. 25000"
        keyboardType="decimal-pad"
        error={totalError}
        helper="Boş bırakılırsa bütçe tanımlı sayılmaz."
      />

      <Text variant="h3" style={styles.sectionTitle}>
        Kategori limitleri
      </Text>

      {LIMIT_CATEGORY_IDS.map((categoryId) => {
        const category = DEFAULT_CATEGORIES.find((item) => item.id === categoryId);
        return (
          <TextField
            key={categoryId}
            label={`${category?.name ?? categoryId} (₺)`}
            value={limits[categoryId] ?? ''}
            onChangeText={(value) => setLimit(categoryId, value)}
            placeholder="Limit yok"
            keyboardType="decimal-pad"
            style={styles.fields}
          />
        );
      })}
    </FormScreen>
  );
}

function categoryLabel(categoryId: string): string {
  return DEFAULT_CATEGORIES.find((item) => item.id === categoryId)?.name ?? categoryId;
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.lg },
  fields: { marginTop: spacing.md },
  sectionTitle: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  footerRow: { flexDirection: 'row', gap: spacing.md },
  clearButton: { flex: 1 },
  saveButton: { flex: 2 },
});