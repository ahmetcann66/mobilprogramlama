import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '@/theme';
import { PressableScale } from './PressableScale';

export interface CardProps {
  readonly children: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly padded?: boolean;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
}

/**
 * Yüzey kartı. Koyu temada derinlik ağırlıklı olarak renk kontrastı ve
 * ince kenarla sağlanır; gölge ölçülü tutulur.
 */
export function Card({
  children,
  style,
  padded = true,
  onPress,
  accessibilityLabel,
}: CardProps): React.JSX.Element {
  const content = (
    <View style={[styles.card, padded ? styles.padded : null, style]}>{children}</View>
  );

  if (onPress === undefined) return content;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  padded: { padding: spacing.lg },
});
