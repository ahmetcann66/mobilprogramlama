import React from 'react';
import type { TextStyle } from 'react-native';
import type { Minor } from '@/types';
import { formatMinor } from '@/utils/money';
import { amountColor, type AmountTone } from '@/theme';
import { Text, type TextProps } from './Text';

export interface AmountTextProps {
  readonly minor: Minor;
  readonly currency?: string;
  readonly tone?: AmountTone;
  /** İşareti (+/-) tutarın önüne ekler. */
  readonly signed?: boolean;
  readonly variant?: TextProps['variant'];
  readonly style?: TextStyle;
  readonly color?: string;
}

/**
 * Parasal tutarı doğru biçimde (₺1.234,56) gösterir. Gelir/gider yönü
 * yalnızca renkle değil, `signed` verildiğinde + / - işaretiyle de belirtilir.
 */
export function AmountText({
  minor,
  currency = 'TRY',
  tone = 'neutral',
  signed = false,
  variant = 'bodyStrong',
  style,
  color,
}: AmountTextProps): React.JSX.Element {
  const formatted = formatMinor(minor, currency);
  const sign = signed ? (minor >= 0 ? '+' : '−') : '';
  const resolvedColor = color ?? amountColor(tone);
  const text = signed ? `${sign}${formatted.replace('-', '')}` : formatted;

  return (
    <Text variant={variant} color={resolvedColor} tabular style={style}>
      {text}
    </Text>
  );
}

export const amountToneForType = (type: 'income' | 'expense'): AmountTone =>
  type === 'income' ? 'income' : 'expense';
