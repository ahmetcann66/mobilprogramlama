import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';
import { Text } from './Text';

export interface TextFieldProps {
  readonly label?: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly error?: string | null;
  readonly helper?: string;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly secureTextEntry?: boolean;
  readonly multiline?: boolean;
  readonly numberOfLines?: number;
  readonly maxLength?: number;
  readonly autoFocus?: boolean;
  readonly returnKeyType?: TextInputProps['returnKeyType'];
  readonly onSubmitEditing?: TextInputProps['onSubmitEditing'];
  readonly icon?: React.ReactNode;
  readonly rightAccessory?: React.ReactNode;
  readonly editable?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly accessibilityLabel?: string;
  readonly inputMode?: TextInputProps['inputMode'];
}

/**
 * Etiketli, hatalı durumu görsel olarak belli eden metin alanı.
 * Odaklandığında kenarlık vurgu rengine döner; hata varsa kırmızı kalır.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error = null,
  helper,
  keyboardType,
  secureTextEntry,
  multiline,
  numberOfLines,
  maxLength,
  autoFocus,
  returnKeyType,
  onSubmitEditing,
  icon,
  rightAccessory,
  editable = true,
  style,
  accessibilityLabel,
  inputMode,
}: TextFieldProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);

  const borderColor =
    error !== null ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.wrapper, style]}>
      {label !== undefined ? (
        <Text variant="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          multiline === true ? styles.fieldMultiline : null,
          { borderColor },
          editable ? null : styles.disabled,
        ]}
      >
        {icon !== undefined ? <View style={styles.leading}>{icon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          inputMode={inputMode}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={accessibilityLabel ?? label}
          style={[styles.input, multiline === true ? styles.inputMultiline : null]}
          selectionColor={colors.primary}
        />
        {rightAccessory !== undefined ? <View style={styles.trailing}>{rightAccessory}</View> : null}
      </View>

      {error !== null ? (
        <Text variant="caption" color={colors.danger} style={styles.message}>
          {error}
        </Text>
      ) : helper !== undefined ? (
        <Text variant="caption" color={colors.textMuted} style={styles.message}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: { marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  fieldMultiline: { minHeight: 96, alignItems: 'flex-start', paddingVertical: spacing.md },
  disabled: { opacity: 0.6 },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  inputMultiline: { textAlignVertical: 'top', minHeight: 72 },
  leading: { marginRight: spacing.sm },
  trailing: { marginLeft: spacing.sm },
  message: { marginTop: spacing.xs },
});
