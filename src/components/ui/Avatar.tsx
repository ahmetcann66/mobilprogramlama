import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { Text } from './Text';

export interface AvatarProps {
  readonly name: string;
  readonly size?: number;
}

/** İsimden baş harfleri türeten basit profil simgesi. */
export function Avatar({ name, size = 44 }: AvatarProps): React.JSX.Element {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr'))
    .join('');

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text variant="bodyStrong" color={colors.textInverse}>
        {initials === '' ? 'FB' : initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
