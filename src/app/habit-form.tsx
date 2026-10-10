import React, { useState } from 'react';
import { Alert, Switch, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash } from 'lucide-react-native';
import type { HabitCategory, HabitFrequency } from '@/types';
import { HABIT_CATEGORIES, HABIT_CATEGORY_META } from '@/constants/habits';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, iconSize, spacing } from '@/theme';
import { createId } from '@/utils/id';
import { nowIso } from '@/utils/date';
import { validateName } from '@/utils/validation';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { FormScreen } from '@/components/ui/FormScreen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

const FREQUENCY_OPTIONS = [
  { value: 'daily' as const, label: 'Günlük' },
  { value: 'weekly' as const, label: 'Haftalık' },
];

/** Alışkanlık ekleme/düzenleme formu. */
export default function HabitFormScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, dispatch } = useAppData();
  const haptics = useHaptics();

  const editing = id !== undefined ? data.habits.find((habit) => habit.id === id) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [category, setCategory] = useState<HabitCategory>(editing?.category ?? 'finance');
  const [frequency, setFrequency] = useState<HabitFrequency>(editing?.frequency ?? 'daily');
  const [active, setActive] = useState(editing?.active ?? true);

  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = (): void => {
    if (submitting) return;
    setNameError(validateName(name, 'Alışkanlık adı'));
    if (name.trim() === '') return;

    setSubmitting(true);
    try {
      const patch = {
        name: name.trim(),
        category,
        frequency,
        active,
        ...(description.trim() !== '' ? { description: description.trim() } : {}),
      };
      if (editing !== undefined) {
        dispatch({ type: 'update-habit', id: editing.id, patch });
        haptics.light();
      } else {
        dispatch({ type: 'add-habit', habit: { id: createId('habit'), createdAt: nowIso(), ...patch } });
        haptics.success();
      }
      router.back();
    } catch {
      setSubmitting(false);
      Alert.alert('Kaydedilemedi', 'Alışkanlık kaydedilirken bir sorun oluştu.');
    }
  };

  const confirmDelete = (): void => {
    if (editing === undefined) return;
    Alert.alert(
      'Alışkanlığı sil',
      `${editing.name} alışkanlığı ve tamamlanma geçmişi silinecek. Devam edilsin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'delete-habit', id: editing.id });
            haptics.warning();
            router.back();
          },
        },
      ],
    );
  };

  return (
    <FormScreen
      title={editing !== undefined ? 'Alışkanlığı düzenle' : 'Yeni alışkanlık'}
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
        label="Alışkanlık adı"
        value={name}
        onChangeText={setName}
        placeholder="örn. Günlük harcamalarımı kaydet"
        error={nameError}
        autoFocus
      />

      <TextField
        label="Açıklama (isteğe bağlı)"
        value={description}
        onChangeText={setDescription}
        placeholder="Neden bunu yapıyorsun?"
        maxLength={120}
        style={styles.fields}
      />

      <Text variant="label" color={colors.textSecondary} style={styles.fieldLabel}>
        Kategori
      </Text>
      <View style={styles.categories}>
        {HABIT_CATEGORIES.map((key) => (
          <Chip
            key={key}
            label={HABIT_CATEGORY_META[key].label}
            selected={category === key}
            onPress={() => setCategory(key)}
            accent={HABIT_CATEGORY_META[key].color}
          />
        ))}
      </View>

      <Text variant="label" color={colors.textSecondary} style={styles.fieldLabel}>
        Hedef sıklığı
      </Text>
      <SegmentedControl options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} />

      <View style={styles.activeRow}>
        <View style={styles.activeText}>
          <Text variant="bodyStrong">Aktif takip</Text>
          <Text variant="caption" color={colors.textMuted}>
            Kapalıysa alışkanlık listelenmez, geçmişi korunur.
          </Text>
        </View>
        <Switch
          value={active}
          onValueChange={setActive}
          trackColor={{ true: colors.primary, false: colors.surfaceHighlight }}
          thumbColor={colors.white}
        />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  fields: { marginTop: spacing.lg },
  fieldLabel: { marginBottom: spacing.sm, marginTop: spacing.lg },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
  },
  activeText: { flex: 1, paddingRight: spacing.lg },
  editFooter: { flexDirection: 'row', gap: spacing.md },
  deleteButton: { flex: 1 },
  saveButton: { flex: 2 },
});