import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Archive, CalendarClock, Pencil, Plus, Trash } from 'lucide-react-native';
import type { GoalStatus } from '@/types';
import { computeGoalProgress, contributionsFor } from '@/services/goals/goals';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, iconSize, spacing } from '@/theme';
import { formatDateTR, isValidDateKey, nowIso, todayKey } from '@/utils/date';
import { createId } from '@/utils/id';
import { parseAmountInput } from '@/utils/validation';
import { formatMinor } from '@/utils/money';
import { AmountText } from '@/components/ui/AmountText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { FormScreen } from '@/components/ui/FormScreen';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

function goalStatusBadgeTone(status: GoalStatus): 'success' | 'neutral' | 'warning' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'archived':
      return 'neutral';
    case 'active':
      return 'warning';
  }
}

function goalStatusLabel(status: GoalStatus): string {
  switch (status) {
    case 'completed':
      return 'Tamamlandı';
    case 'archived':
      return 'Arşiv';
    case 'active':
      return 'Aktif';
  }
}

export default function GoalDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, dispatch } = useAppData();
  const haptics = useHaptics();
  const currency = data.preferences.currency;
  const insets = useSafeAreaInsets();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayKey());
  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const goal = data.goals.find((item) => item.id === id);
  const progress = useMemo(
    () => (goal !== undefined ? computeGoalProgress(goal, data.contributions) : null),
    [goal, data.contributions],
  );
  const list = useMemo(
    () => (goal !== undefined ? contributionsFor(data.contributions, goal.id) : []),
    [goal, data.contributions],
  );

  const openContributionSheet = (): void => {
    setAmount('');
    setDate(todayKey());
    setAmountError(null);
    setDateError(null);
    setSheetOpen(true);
  };

  const submitContribution = (): void => {
    if (goal === undefined) return;
    const parsed = parseAmountInput(amount);
    if (!parsed.ok) {
      setAmountError(parsed.error);
      return;
    }
    if (!isValidDateKey(date)) {
      setDateError('Geçerli bir tarih girin (GG.AA.YYYY)');
      return;
    }
    dispatch({
      type: 'add-contribution',
      contribution: {
        id: createId('contrib'),
        goalId: goal.id,
        amountMinor: parsed.minor,
        date,
        createdAt: nowIso(),
      },
    });
    haptics.success();
    setSheetOpen(false);
  };

  const confirmRemove = (contributionId: string, amountLabel: string): void => {
    Alert.alert(
      'Katkıyı sil',
      `${amountLabel} tutarındaki katkı geri alınamaz biçimde silinecek. Devam edilsin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'remove-contribution', id: contributionId });
            haptics.warning();
          },
        },
      ],
    );
  };

  const archiveGoal = (): void => {
    if (goal === undefined) return;
    Alert.alert('Hedefi arşivle', `${goal.name} hedefi arşivlenecek. Bu işlem geri alınabilir.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Arşivle',
        onPress: () => {
          dispatch({ type: 'archive-goal', id: goal.id });
          haptics.light();
          router.back();
        },
      },
    ]);
  };

  if (goal === undefined || progress === null) {
    return (
      <FormScreen title="Hedef" onClose={() => router.back()}>
        <Text variant="body" color={colors.textSecondary}>
          Hedef bulunamadı.
        </Text>
      </FormScreen>
    );
  }

  const statusTone = goalStatusBadgeTone(goal.status);

  return (
    <FormScreen
      title={goal.name}
      onClose={() => router.back()}
      footer={
        goal.status === 'active' ? (
          <Button
            label="Katkı ekle"
            icon={<Plus size={iconSize.sm} color={colors.textInverse} />}
            onPress={openContributionSheet}
            fullWidth
          />
        ) : undefined
      }
    >
      {/* İlerleme özeti */}
      <Card style={styles.progressCard}>
        <View style={styles.progressTop}>
          <ProgressRing
            progress={progress.ratio}
            size={104}
            strokeWidth={9}
            color={progress.reached ? colors.secondary : colors.primary}
          >
            <Text variant="h3" tabular>
              %{progress.percent}
            </Text>
          </ProgressRing>
          <View style={styles.progressMeta}>
            <Badge label={goalStatusLabel(goal.status)} tone={statusTone} style={styles.statusBadge} />
            <Text variant="caption" color={colors.textMuted} style={styles.targetText}>
              Hedef {formatMinor(goal.targetMinor, currency)}
            </Text>
            {goal.deadline !== undefined ? (
              <View style={styles.deadlineRow}>
                <CalendarClock size={13} color={colors.textMuted} />
                <Text variant="caption" color={colors.textMuted}>
                  {formatDateTR(goal.deadline)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <ProgressBar
          progress={progress.ratio}
          color={progress.reached ? colors.secondary : colors.primary}
          style={styles.progressBar}
        />

        <View style={styles.amountsRow}>
          <View>
            <Text variant="caption" color={colors.textMuted}>
              Biriken
            </Text>
            <AmountText minor={progress.savedMinor} currency={currency} variant="bodyStrong" />
          </View>
          <View style={styles.amountsRight}>
            <Text variant="caption" color={colors.textMuted}>
              Kalan
            </Text>
            <AmountText
              minor={progress.remainingMinor}
              currency={currency}
              variant="bodyStrong"
              tone={progress.reached ? 'income' : 'neutral'}
            />
          </View>
        </View>

        {progress.overflowMinor > 0 ? (
          <Text variant="caption" color={colors.income}>
            Hedefin {formatMinor(progress.overflowMinor, currency)} üzerinde birikim yapıldı.
          </Text>
        ) : null}

        {goal.note !== undefined ? (
          <Text variant="body" color={colors.textSecondary} style={styles.note}>
            {goal.note}
          </Text>
        ) : null}
      </Card>

      {/* Katkı geçmişi */}
      <View style={styles.sectionHeader}>
        <Text variant="h3">Katkı geçmişi</Text>
        <Text variant="caption" color={colors.textMuted}>
          {list.length} kayıt
        </Text>
      </View>

      <Card>
        {list.length === 0 ? (
          <Text variant="body" color={colors.textSecondary} style={styles.noContributions}>
            Henüz katkı eklenmemiş. &apos;+ Katkı ekle&apos; ile birikimine ekleme yapabilirsin.
          </Text>
        ) : (
          list.map((contribution, index) => (
            <View key={contribution.id}>
              {index > 0 ? <Divider /> : null}
              <View style={styles.contributionRow}>
                <View style={styles.contributionMeta}>
                  <Text variant="bodyStrong">{formatDateTR(contribution.date)}</Text>
                  <AmountText minor={contribution.amountMinor} currency={currency} tone="income" signed />
                </View>
                <PressableScale
                  onPress={() =>
                    confirmRemove(contribution.id, formatMinor(contribution.amountMinor, currency))
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Katkıyı sil"
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
          onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
          style={styles.actionButton}
        />
        {goal.status !== 'archived' ? (
          <Button
            label="Arşivle"
            variant="ghost"
            icon={<Archive size={iconSize.sm} color={colors.warning} />}
            onPress={archiveGoal}
            style={styles.actionButton}
          />
        ) : null}
      </View>

      {/* Katkı ekleme sheet */}
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
                Katkı ekle
              </Text>
            <TextField
              label="Tutar (₺)"
              value={amount}
              onChangeText={setAmount}
              placeholder="örn. 500 veya 1250,50"
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
            <View style={styles.modalActions}>
              <Button label="Vazgeç" variant="secondary" onPress={() => setSheetOpen(false)} style={styles.actionButton} />
              <Button label="Ekle" onPress={submitContribution} style={styles.actionButton} />
            </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  progressCard: { marginBottom: spacing.xl },
  progressTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  progressMeta: { flex: 1, alignItems: 'flex-start' },
  statusBadge: { marginBottom: spacing.sm },
  targetText: { marginBottom: spacing.xs },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressBar: { marginTop: spacing.lg },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  amountsRight: { alignItems: 'flex-end' },
  note: { marginTop: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  noContributions: { paddingVertical: spacing.md },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  contributionMeta: { gap: spacing.xxs },
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
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});