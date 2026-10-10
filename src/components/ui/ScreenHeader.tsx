import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

export interface ScreenHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly right?: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

/** Sekme ekranlarının üst başlığı: başlık + alt açıklama + sağ aksiyon. */
export function ScreenHeader({
  title,
  subtitle,
  right,
  style,
}: ScreenHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.texts}>
        <Text variant="h1">{title}</Text>
        {subtitle !== undefined ? (
          <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right !== undefined ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  texts: { flex: 1, paddingRight: spacing.md },
  subtitle: { marginTop: spacing.xxs },
  right: { flexDirection: 'row', alignItems: 'center' },
});
