// Yan etkisi nedeniyle en önce yüklenmeli; bu yüzden ilk import.
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { AppDataProvider, useAppData } from '@/store/AppDataContext';
import { BrandSplash } from '@/components/ui/BrandSplash';
import { colors } from '@/theme';

/**
 * Uygulamanın kök düzeni.
 *
 * Sıralama önemlidir: GestureHandler -> SafeArea -> AppDataProvider -> Stack.
 * Font'lar yüklenene ve depodaki veri hazır olana kadar markalı açılış
 * ekranı gösterilir; ardından normal arayüze geçilir.
 */
function RootNavigator(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="goals" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="debts" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="budget" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="transaction-form"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="habit-form"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="goal-form"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="goal-detail"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="debt-form"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="debt-detail"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="budget-form"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}

/** Yükleme durumunu yöneten iç bileşen (provider içinde). */
function Bootstrap({ fontsReady }: { readonly fontsReady: boolean }): React.JSX.Element {
  const { status } = useAppData();
  if (!fontsReady || status === 'loading') {
    return <BrandSplash />;
  }
  return <RootNavigator />;
}

export default function RootLayout(): React.JSX.Element {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Font yüklenemezse sistem fontuyla devam edilir; uygulama kilitlenmez.
  const fontsReady = fontsLoaded || fontError !== null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppDataProvider>
          <StatusBar style="light" />
          <Bootstrap fontsReady={fontsReady} />
        </AppDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
