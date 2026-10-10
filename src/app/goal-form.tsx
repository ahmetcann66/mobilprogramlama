import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash } from 'lucide-react-native';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, iconSize, spacing } from '@/theme';
import { createId } from '@/utils/id';
import { formatDateInput, nowIso, parseDateInput } from '@/utils/date';
import { parseAmountInput, validateName } from '@/utils/validation';
import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/FormScreen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

/** Tasarruf hedefi ekleme/düzenleme formu. */
export default function GoalFormScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, dispatch } = useAppData();
  const haptics = useHaptics();

  const editing = id !== undefined ? data.goals.find((goal) => goal.id === id) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [target, setTarget] = useState(
    editing !== undefined ? (editing.targetMinor / 100).toString().replace('.', ',') : '',
  );
  const [initial, setInitial] = useState(
    editing !== undefined && editing.initialMinor > 0
      ? (editing.initialMinor / 100).toString().replace('.', ',')
      : '',
  );
  const [deadline, setDeadline] = useState(
    editing?.deadline !== undefined ? formatDateInput(editing.deadline) : '',
  );
  const [note, setNote] = useState(editing?.note ?? '');
  const [roundUpEnabled, setRoundUpEnabled] = useState(editing?.roundUpEnabled ?? false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = (): void => {
    if (submitting) return;
    setNameError(validateName(name, 'Hedef adı'));
    if (name.trim() === '') return;

    const targetResult = parseAmountInput(target);
    if (!targetResult.ok) {
      setTargetError(targetResult.error === 'Tutar sıfırdan büyük olmalı' ? 'Hedef tutarı sıfırdan büyük olmalı' : targetResult.error);
      return;
    }

    let initialMinor = 0;
    if (initial.trim() !== '') {
      const initialResult = parseAmountInput(initial);
      if (!initialResult.ok) {
        setInitialError('Geçerli bir başlangıç birikimi girin');
        return;
      }
      initialMinor = initialResult.minor;
    }

    let deadlineKey: string | undefined;
    if (deadline.trim() !== '') {
      const parsedDeadline = parseDateInput(deadline);
      if (parsedDeadline === null) {
        setDeadlineError('Geçerli bir tarih girin (GG.AA.YYYY)');
        return;
      }
      deadlineKey = parsedDeadline;
    }

    setSubmitting(true);
    try {
      const patch = {
        name: name.trim(),
        targetMinor: targetResult.minor,
        initialMinor: initialMinor > targetResult.minor ? targetResult.minor : initialMinor,
        note: note.trim() !== '' ? note.trim() : undefined,
        deadline: deadlineKey,
        roundUpEnabled,
      };
      if (editing !== undefined) {
        dispatch({ type: 'update-goal', id: editing.id, patch });
        haptics.light();
      } else {
        dispatch({
          type: 'add-goal',
          goal: {
            id: createId('goal'),
            name: patch.name,
            targetMinor: patch.targetMinor,
            initialMinor: patch.initialMinor,
            status: 'active',
            createdAt: nowIso(),
            roundUpEnabled,
            ...(patch.deadline !== undefined ? { deadline: patch.deadline } : {}),
            ...(patch.note !== undefined ? { note: patch.note } : {}),
          },
        });
        haptics.success();
      }
      router.back();
    } catch {
      setSubmitting(false);
      Alert.alert('Kaydedilemedi', 'Hedef kaydedilirken bir sorun oluştu.');
    }
  };

  const confirmDelete = (): void => {
    if (editing === undefined) return;
    Alert.alert(
      'Hedefi sil',
      `${editing.name} hedefi ve katkıları silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'delete-goal', id: editing.id });
            haptics.warning();
            router.back();
          },
        },
      ],
    );
  };

  return (
    <FormScreen
      title={editing !== undefined ? 'Hedefi düzenle' : 'Yeni hedef'}
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
        label="Hedef adı"
        value={name}
        onChangeText={setName}
        placeholder="örn. Yeni bilgisayar"
        error={nameError}
        autoFocus
      />

      <TextField
        label="Hedef tutarı (₺)"
        value={target}
        onChangeText={setTarget}
        placeholder="örn. 25000"
        keyboardType="decimal-pad"
        error={targetError}
        style={styles.fields}
      />

      <TextField
        label="Başlangıç birikimi (₺) — isteğe bağlı"
        value={initial}
        onChangeText={setInitial}
        placeholder="örn. 3000"
        keyboardType="decimal-pad"
        error={initialError}
        style={styles.fields}
        helper="Hedef tutarını aşamaz."
      />

      <TextField
        label="Hedef tarihi (GG.AA.YYYY) — isteğe bağlı"
        value={deadline}
        onChangeText={setDeadline}
        placeholder="örn. 01.12.2026"
        error={deadlineError}
        style={styles.fields}
      />

      <TextField
        label="Açıklama (isteğe bağlı)"
        value={note}
        onChangeText={setNote}
        placeholder="Bu hedefi neden oluşturuyorsun?"
        maxLength={160}
        multiline
        style={styles.fields}
      />

      <View style={styles.roundUpRow}>
        <View style={styles.roundUpText}>
          <Text variant="bodyStrong">Kumbara (bozuk para biriktir)</Text>
          <Text variant="caption" color={colors.textMuted}>
            Açıkken her giderin kuruş farkı (1 TL&apos;ye tamamlanan) otomatik bu hedefe birikir.
            Aynı anda yalnızca bir hedefte etkin olması önerilir.
          </Text>
        </View>
        <Switch
          value={roundUpEnabled}
          onValueChange={setRoundUpEnabled}
          trackColor={{ true: colors.secondary, false: colors.surfaceHighlight }}
          thumbColor={colors.white}
        />
      </View>

      <Text variant="caption" color={colors.textMuted} style={styles.note}>
        Not: Hedefe eklenen katkılar genel gider toplamlarını etkilemez; yalnızca birikiminizi artırır.
      </Text>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  fields: { marginTop: spacing.lg },
  note: { marginTop: spacing.lg, lineHeight: 18 },
  roundUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
  },
  roundUpText: { flex: 1, paddingRight: spacing.lg, gap: 2 },
  editFooter: { flexDirection: 'row', gap: spacing.md },
  deleteButton: { flex: 1 },
  saveButton: { flex: 2 },
});