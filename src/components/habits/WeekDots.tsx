import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

export interface WeekDotsProps {
  readonly dots: readonly boolean[];
}

/** Son günlerin tamamlanma durumunu gösteren küçük nokta dizisi. */
export function WeekDots({ dots }: WeekDotsProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      {dots.map((done, index) => (
        <View
          key={index}
          style={[styles.dot, done ? styles.dotDone : styles.dotIdle]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDone: { backgroundColor: colors.primary },
  dotIdle: { backgroundColor: colors.surfaceHighlight },
});
