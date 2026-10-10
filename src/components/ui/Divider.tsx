import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';

export interface DividerProps {
  readonly style?: StyleProp<ViewStyle>;
  readonly inset?: boolean;
}

/** İnce ayırıcı çizgi. */
export function Divider({ style, inset = false }: DividerProps): React.JSX.Element {
  return <View style={[styles.line, inset ? styles.inset : null, style]} />;
}

const styles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, width: '100%' },
  inset: { marginLeft: spacing.xxxl + spacing.xl },
});
