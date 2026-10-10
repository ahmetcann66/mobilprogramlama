import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Database, Info, User } from 'lucide-react-native';
import { createDemoData } from '@/services/seed';
import { createInitialData } from '@/services/storage';
import { useAppData } from '@/store/AppDataContext';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, iconSize, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

const CURRENCIES = ['TRY', 'USD', 'EUR'] as const;

export default function SettingsScreen(): React.JSX.Element {
  const { data, dispatch, replaceAll } = useAppData();
  const haptics = useHaptics();

  const [displayName, setDisplayName] = useState(data.preferences.displayName);

  const setCurrency = (currency: string): void => {
    dispatch({ type: 'set-preferences', patch: { currency } });
    haptics.light();
  };

  const setWeekStart = (weekStartsOn: 0 | 1): void => {
    dispatch({ type: 'set-preferences', patch: { weekStartsOn } });
    haptics.light();
  };

  const togglePreference = (patch: Partial<typeof data.preferences>): void => {
    dispatch({ type: 'set-preferences', patch });
    haptics.light();
  };

  const saveName = (): void => {
    const trimmed = displayName.trim();
    dispatch({ type: 'set-preferences', patch: { displayName: trimmed || 'Kullanıcı' } });
    haptics.success();
  };

  const loadDemoData = (): void => {
    Alert.alert(
      'Demo verisi yüklensin mi?',
      'Mevcut veriler değiştirilir ve yerine örnek gelir, gider, alışkanlık ve hedef kayıtları eklenir. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Yükle',
          style: 'destructive',
          onPress: () => {
            void replaceAll(createDemoData());
            haptics.warning();
          },
        },
      ],
    );
  };

  const resetAll = (): void => {
    Alert.alert(
      'Tüm veriler silinsin mi?',
      'İşlemler, alışkanlıklar, hedefler ve katkılar kalıcı olarak silinir ve uygulama sıfırdan başlar.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            void replaceAll(createInitialData());
            haptics.warning();
          },
        },
      ],
    );
  };

  const exportData = (): void => {
    const json = JSON.stringify(
      {
        version: data.version,
        transactions: data.transactions,
        habits: data.habits,
        completions: data.completions,
        goals: data.goals,
        contributions: data.contributions,
        budget: data.budget,
        preferences: data.preferences,
      },
      null,
      2,
    );
    Alert.alert('Veri dışa aktarımı', json, [
      { text: 'Kapat', style: 'cancel', onPress: () => haptics.light() },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Ayarlar" subtitle="Tercihlerinizi ve verilerinizi yönetin" />

        <Card>
          <View style={styles.sectionRow}>
            <User size={iconSize.sm} color={colors.primary} />
            <Text variant="h3">Profil</Text>
          </View>
          <TextField
            label="Görünen ad"
            value={displayName}
            onChangeText={setDisplayName}
            onSubmitEditing={saveName}
            returnKeyType="done"
            placeholder="Adınız"
            style={styles.field}
          />
        </Card>

        <Card>
          <View style={styles.sectionRow}>
            <Info size={iconSize.sm} color={colors.secondary} />
            <Text variant="h3">Tercihler</Text>
          </View>

          <Text variant="label" style={styles.settingTitle}>
            Para birimi
          </Text>
          <View style={styles.chips}>
            {CURRENCIES.map((currency) => (
              <Chip
                key={currency}
                label={currency}
                selected={data.preferences.currency === currency}
                onPress={() => setCurrency(currency)}
              />
            ))}
          </View>

          <Divider style={styles.divider} />

          <Text variant="label" style={styles.settingTitle}>
            Haftanın ilk günü
          </Text>
          <View style={styles.chips}>
            <Chip
              label="Pazar"
              selected={data.preferences.weekStartsOn === 0}
              onPress={() => setWeekStart(0)}
            />
            <Chip
              label="Pazartesi"
              selected={data.preferences.weekStartsOn === 1}
              onPress={() => setWeekStart(1)}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTexts}>
              <Text variant="bodyStrong">Dokunsal geri bildirim</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Onaylar ve işlemlerde hafif titreşim.
              </Text>
            </View>
            <Switch
              value={data.preferences.hapticsEnabled}
              onValueChange={(value) => togglePreference({ hapticsEnabled: value })}
              trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.surfaceHighlight}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTexts}>
              <Text variant="bodyStrong">Azaltılmış hareket</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Animasyonları yumuşatır; pil tasarrufu sağlar.
              </Text>
            </View>
            <Switch
              value={data.preferences.reducedMotion}
              onValueChange={(value) => togglePreference({ reducedMotion: value })}
              trackColor={{ false: colors.surfaceHighlight, true: colors.secondary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.surfaceHighlight}
            />
          </View>
        </Card>

        <Card>
          <View style={styles.sectionRow}>
            <Database size={iconSize.sm} color={colors.warning} />
            <Text variant="h3">Veriler</Text>
          </View>

          <Text variant="body" color={colors.textSecondary} style={styles.dataNote}>
            Tüm veriler yalnızca bu cihazda, yerel olarak saklanır. Buluta bağlantı kurulmaz.
          </Text>

          <View style={styles.actions}>
            <Button label="Veri dışa aktar" variant="secondary" onPress={exportData} style={styles.actionButton} />
            <Button label="Demo verisi yükle" variant="secondary" onPress={loadDemoData} style={styles.actionButton} />
          </View>
          <Button label="Tüm verileri sıfırla" variant="danger" onPress={resetAll} style={styles.dangerButton} />
        </Card>

        <Text variant="micro" color={colors.textMuted} style={styles.about}>
          FinHabit · sürüm 0.1.0 · Mobil Programlama dersi için eğitim amaçlı geliştirildi.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  field: { marginTop: spacing.md },
  settingTitle: { marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  divider: { marginVertical: spacing.lg },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  switchTexts: { flex: 1, paddingRight: spacing.md },
  dataNote: { marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  actionButton: { flex: 1 },
  dangerButton: { marginTop: spacing.xs },
  about: { marginTop: spacing.xl, textAlign: 'center' },
});