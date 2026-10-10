import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius } from '@/theme';

export interface IconBadgeProps {
  readonly children: React.ReactNode;
  /** Arka plan rengi (genelde yarı saydam vurgu tonu). */
  readonly backgroundColor: string;
  readonly size?: number;
  readonly shape?: 'circle' | 'squircle';
  readonly style?: StyleProp<ViewStyle>;
}

/** Renkli, yumuşak köşeli ikon kapsayıcısı; kategori/ikon vurgularında kullanılır. */
export function IconBadge({
  children,
  backgroundColor,
  size = 44,
  shape = 'squircle',
  style,
}: IconBadgeProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          backgroundColor,
          borderRadius: shape === 'circle' ? size / 2 : radius.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
