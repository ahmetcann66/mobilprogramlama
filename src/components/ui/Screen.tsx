import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

export interface ScreenProps {
  readonly children: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly padded?: boolean;
  readonly edges?: readonly Edge[];
}

/**
 * Tüm ekranların ortak zemin ve güvenli alan sarmalayıcısı.
 * Üst çentikli cihazlarda içeriğin üstte kalmasını engeller.
 */
export function Screen({
  children,
  style,
  padded = false,
  edges = ['top'],
}: ScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safe} edges={edges as Edge[]}>
      <View style={[styles.content, padded ? styles.padded : null, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: spacing.xl },
});
