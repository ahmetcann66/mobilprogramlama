import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, iconSize, shadows, spacing } from '@/theme';
import { PressableScale } from './PressableScale';

export interface FABProps {
  readonly onPress: () => void;
  readonly icon?: React.ReactNode;
  readonly accessibilityLabel: string;
  readonly style?: StyleProp<ViewStyle>;
}

/** Yüzen aksiyon butonu (yeni kayıt ekleme). */
export function FAB({ onPress, icon, accessibilityLabel, style }: FABProps): React.JSX.Element {
  return (
    <View style={[styles.anchor, style]} pointerEvents="box-none">
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={styles.button}
      >
        {icon ?? <Plus size={iconSize.lg} color={colors.textInverse} strokeWidth={2.5} />}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
  },
  button: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
});
