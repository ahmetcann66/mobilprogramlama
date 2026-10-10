import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing } from '@/theme';
import { IconBadge } from '@/components/ui/IconBadge';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';

export interface QuickActionProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly color: string;
  readonly onPress: () => void;
}

/** Dashboard üstündeki hızlı işlem kutusu (gelir/gider/alışkanlık/hedef ekle). */
export function QuickAction({ icon: Icon, label, color, onPress }: QuickActionProps): React.JSX.Element {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.tile}
    >
      <IconBadge backgroundColor={`${color}1F`} size={44} shape="circle">
        <Icon size={20} color={color} />
      </IconBadge>
      <View style={styles.label}>
        <Text variant="caption" color={colors.textSecondary} center numberOfLines={2}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  label: { marginTop: spacing.sm, minHeight: 32, justifyContent: 'center' },
});
