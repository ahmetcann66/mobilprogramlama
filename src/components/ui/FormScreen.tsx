import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, iconSize, spacing } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface FormScreenProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Modal form ekranlarının ortak iskeleti: başlık + kapatma, kaydırılabilir
 * içerik ve sabit alt aksiyon alanı. Klavye açıldığında alanların görünür
 * kalmasını sağlar.
 */
export function FormScreen({
  title,
  onClose,
  children,
  footer,
  contentStyle,
}: FormScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text variant="h2" style={styles.headerTitle}>
          {title}
        </Text>
        <PressableScale
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          style={styles.close}
        >
          <X size={iconSize.md} color={colors.textSecondary} />
        </PressableScale>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {footer !== undefined ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: { flex: 1 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
});
