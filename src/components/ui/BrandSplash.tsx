import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Wallet } from 'lucide-react-native';
import { colors, duration, easing, radius, spacing } from '@/theme';
import { Text } from './Text';

/**
 * Marka açılış ekranı. Yalnızca font/veri yüklenirken kısa süre gösterilir;
 * kullanıcıyı gereksiz bekletmez. Reduced Motion açıkken animasyon atlanır.
 */
export function BrandSplash(): React.JSX.Element {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textShift = useSharedValue(12);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: duration.base, easing: easing.enter });
    logoScale.value = withTiming(1, { duration: duration.slow, easing: easing.spring });
    textOpacity.value = withDelay(120, withTiming(1, { duration: duration.slow }));
    textShift.value = withDelay(120, withTiming(0, { duration: duration.slow, easing: easing.enter }));
  }, [logoOpacity, logoScale, textOpacity, textShift]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textShift.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, logoStyle]}>
        <Wallet size={40} color={colors.textInverse} strokeWidth={2.4} />
      </Animated.View>
      <Animated.View style={textStyle}>
        <Text variant="h1" center style={styles.name}>
          FinHabit
        </Text>
        <Text variant="body" color={colors.textSecondary} center>
          Spend Smarter. Build Better Habits.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  name: { marginBottom: spacing.xs },
});
