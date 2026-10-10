import React from 'react';
import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { colors, tabularNums, typography, type TypographyVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  readonly variant?: TypographyVariant;
  readonly color?: string;
  /** Para/rakam karşılaştırmaları için eşit genişlikli rakamlar. */
  readonly tabular?: boolean;
  readonly center?: boolean;
}

/**
 * Tipografi sistemine bağlı Text bileşeni. Uygulamada doğrudan RNText
 * yerine bu bileşen kullanılır; böylece tüm metinler aynı ölçeğe uyar.
 */
export function Text({
  variant = 'body',
  color = colors.text,
  tabular = false,
  center = false,
  style,
  ...rest
}: TextProps): React.JSX.Element {
  return (
    <RNText
      style={[
        styles.base,
        typography[variant],
        { color },
        tabular ? tabularNums : null,
        center ? styles.center : null,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlign: 'left',
  },
  center: { textAlign: 'center' },
});
