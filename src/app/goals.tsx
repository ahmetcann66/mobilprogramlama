import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PiggyBank } from 'lucide-react-native';
import { computeGoalProgress, summarizeGoals } from '@/services/goals/goals';
import { useAppData } from '@/store/AppDataContext';
import { colors, spacing } from '@/theme';
import { formatMinor } from '@/utils/money';
import { AmountText } from '@/components/ui/AmountText';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { StackHeader } from '@/components/ui/StackHeader';
import { Text } from '@/components/ui/Text';
import { GoalCard } from '@/components/goals/GoalCard';

/** Tasarruf hedefi listesi (ana sekmelerin dışında, stack'ten açılır). */
export default function GoalsScreen(): React.JSX.Element {
  const router = useRouter();
  const { data } = useAppData();
  const currency = data.preferences.currency;

  const active = useMemo(
    () => data.goals.filter((goal) => goal.status === 'active'),
    [data.goals],
  );
  const archived = useMemo(
    () => data.goals.filter((goal) => goal.status === 'archived'),
    [data.goals],
  );

  const summary = summarizeGoals(data.goals, data.contributions);
  const allGoals = [...active, ...archived];

  if (allGoals.length === 0) {
    return (
      <Screen>
        <View style={styles.emptyPage}>
          <StackHeader title="Tasarruf Hedefleri" subtitle="Birikimlerini hedeflere bağla" />
          <EmptyState
            icon={PiggyBank}
            title="Henüz hedef yok"
            description="Bir hedef belirleyip (yeni bilgisayar, acil durum fonu, seyahat...) birikimlerini planlı biçimde ilerlet."
            actionLabel="Hedef oluştur"
            onAction={() => router.push('/goal-form')}
          />
        </View>
        <FAB onPress={() => router.push('/goal-form')} accessibilityLabel="Yeni hedef oluştur" />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={allGoals}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <StackHeader title="Tasarruf Hedefleri" subtitle="Birikimlerini hedeflere bağla" />

            <Card style={styles.summary}>
              <View style={styles.summaryText}>
                <Text variant="caption" color={colors.textMuted}>
                  Toplam birikim
                </Text>
                <AmountText minor={summary.savedTotalMinor} currency={currency} variant="h2" />
                <Text variant="caption" color={colors.textMuted}>
                  / {formatMinor(summary.targetTotalMinor, currency)} hedef
                </Text>
                <ProgressBar
                  progress={
                    summary.targetTotalMinor > 0
                      ? summary.savedTotalMinor / summary.targetTotalMinor
                      : 0
                  }
                  color={colors.secondary}
                  style={styles.summaryBar}
                />
              </View>
              <View style={styles.summaryRight}>
                <Text variant="display" color={colors.secondary} tabular>
                  {summary.activeCount}
                </Text>
                <Text variant="caption" color={colors.textMuted}>
                  aktif
                </Text>
              </View>
            </Card>

            {active.length === 0 ? (
              <Text variant="caption" color={colors.textMuted} style={styles.noActive}>
                Aktif hedef yok; aşağıda arşivlenen hedefler görünür.
              </Text>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const progress = computeGoalProgress(item, data.contributions);
          return (
            <View>
              {index > 0 ? <View style={styles.spacer} /> : null}
              <GoalCard
                goal={item}
                progress={progress}
                currency={currency}
                onPress={(goal) => router.push({ pathname: '/goal-detail', params: { id: goal.id } })}
              />
            </View>
          );
        }}
        ListFooterComponent={
          archived.length > 0 ? (
            <View style={styles.footer}>
              <Divider style={styles.footerDivider} />
              <Text variant="caption" color={colors.textMuted} style={styles.footerText}>
                {archived.length} arşivlenmiş hedef listeye dahil edilmedi.
              </Text>
            </View>
          ) : (
            <View style={styles.summarySpacer} />
          )
        }
      />
      <FAB onPress={() => router.push('/goal-form')} accessibilityLabel="Yeni hedef oluştur" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.huge + spacing.xxl },
  emptyPage: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  summaryText: { flex: 1 },
  summaryBar: { marginTop: spacing.md },
  summaryRight: { alignItems: 'flex-end' },
  noActive: { marginTop: spacing.md },
  spacer: { height: spacing.lg },
  summarySpacer: { height: spacing.huge + spacing.xxl },
  footer: { marginTop: spacing.xxl },
  footerDivider: { marginBottom: spacing.md },
  footerText: { textAlign: 'center' },
});