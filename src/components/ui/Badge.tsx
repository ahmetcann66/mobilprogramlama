import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing } from '@/theme';
import { Text } from './Text';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

export interface BadgeProps {
  readonly label: string;
  readonly tone?: BadgeTone;
  readonly icon?: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: 'rgba(158,171,196,0.14)', fg: '#9EABC4' },
  success: { bg: 'rgba(34,219,149,0.16)', fg: '#22DB95' },
  danger: { bg: 'rgba(255,92,92,0.16)', fg: '#FF6B5E' },
  warning: { bg: 'rgba(245,165,36,0.16)', fg: '#F5A524' },
  info: { bg: 'rgba(91,156,255,0.16)', fg: '#5B9CFF' },
};

/** Küçük durum etiketi. Anlam ikon ve metinle de desteklenir. */
export function Badge({ label, tone = 'neutral', icon, style }: BadgeProps): React.JSX.Element {
  const palette = TONES[tone];
  return (
    <View style={[styles.base, { backgroundColor: palette.bg }, style]}>
      {icon !== undefined ? <View style={styles.icon}>{icon}</View> : null}
      <Text variant="micro" color={palette.fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
  },
  icon: { marginRight: spacing.xs },
});
