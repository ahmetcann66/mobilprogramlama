import React from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly icon?: React.ReactNode;
  readonly fullWidth?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly accessibilityLabel?: string;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 38, md: 48, lg: 54 };

/**
 * Tek bir görsel dile sahip buton bileşeni. Aynı işlev için farklı ekranlarda
 * farklı tasarım üretmemek adına tüm butonlar buradan gelir.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps): React.JSX.Element {
  const inactive = disabled || loading;
  const palette = VARIANT_STYLES[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.base,
        { height: HEIGHTS[size] },
        palette.container,
        fullWidth ? styles.full : null,
        inactive ? styles.inactive : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <View style={styles.content}>
          {icon !== undefined ? <View style={styles.icon}>{icon}</View> : null}
          <Text variant="title" color={palette.text}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const VARIANT_STYLES: Record<ButtonVariant, { container: ViewStyle; text: string }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: colors.textInverse,
  },
  secondary: {
    container: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
    text: colors.text,
  },
  ghost: {
    container: { backgroundColor: colors.transparent },
    text: colors.primary,
  },
  danger: {
    container: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: 'rgba(255,92,92,0.35)' },
    text: colors.danger,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  full: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  inactive: { opacity: 0.5 },
});
