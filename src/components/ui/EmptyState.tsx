import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, iconSize, spacing } from '@/theme';
import { Button } from './Button';
import { IconBadge } from './IconBadge';
import { Text } from './Text';

export interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

/**
 * Boş durum bileşeni. Veri olmadığında sahte grafik/sayı göstermek yerine
 * kullanıcıyı yönlendiren açıklayıcı bir ekran sunulur.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <IconBadge backgroundColor={colors.primarySoft} size={64} shape="circle">
        <Icon size={iconSize.lg} color={colors.primary} />
      </IconBadge>
      <Text variant="h3" center style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color={colors.textSecondary} center style={styles.description}>
        {description}
      </Text>
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button label={actionLabel} onPress={onAction} size="sm" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl },
  title: { marginTop: spacing.lg, marginBottom: spacing.sm },
  description: { maxWidth: 300 },
  action: { marginTop: spacing.xl },
});
