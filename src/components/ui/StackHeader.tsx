import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, iconSize, spacing } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface StackHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly right?: React.ReactNode;
}

/** Stack (itilmiş) ekranları için başlık + geri düğmesi. */
export function StackHeader({ title, subtitle, right }: StackHeaderProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <PressableScale
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Geri"
        style={styles.back}
      >
        <ArrowLeft size={iconSize.md} color={colors.text} />
      </PressableScale>
      <View style={styles.texts}>
        <Text variant="h2">{title}</Text>
        {subtitle !== undefined ? (
          <Text variant="caption" color={colors.textSecondary}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right !== undefined ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
});