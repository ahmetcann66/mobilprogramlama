import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface ChipProps {
  readonly label: string;
  readonly selected?: boolean;
  readonly onPress?: () => void;
  /** Seçiliyken kullanılacak vurgu rengi. */
  readonly accent?: string;
  readonly icon?: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

/** Seçilebilir etiket (filtre, kategori seçimi vb.). */
export function Chip({
  label,
  selected = false,
  onPress,
  accent = colors.primary,
  icon,
  style,
}: ChipProps): React.JSX.Element {
  const content = (
    <View
      style={[
        styles.base,
        selected
          ? { backgroundColor: `${accent}22`, borderColor: `${accent}66` }
          : { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        style,
      ]}
    >
      {icon !== undefined ? <View style={styles.icon}>{icon}</View> : null}
      <Text variant="label" color={selected ? accent : colors.textSecondary}>
        {label}
      </Text>
    </View>
  );

  if (onPress === undefined) return content;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  icon: { marginRight: spacing.xs },
});
