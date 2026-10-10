import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, iconSize, spacing } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface SectionHeaderProps {
  readonly title: string;
  readonly actionLabel?: string;
  readonly onPressAction?: () => void;
  readonly style?: StyleProp<ViewStyle>;
}

/** Bölüm başlığı + isteğe bağlı "Tümü" bağlantısı. */
export function SectionHeader({
  title,
  actionLabel,
  onPressAction,
  style,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.row, style]}>
      <Text variant="h3">{title}</Text>
      {actionLabel !== undefined && onPressAction !== undefined ? (
        <PressableScale
          onPress={onPressAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.action}
        >
          <Text variant="label" color={colors.primary}>
            {actionLabel}
          </Text>
          <ChevronRight size={iconSize.sm} color={colors.primary} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  action: { flexDirection: 'row', alignItems: 'center' },
});
