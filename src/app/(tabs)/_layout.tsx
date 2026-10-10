import React from 'react';
import { Tabs } from 'expo-router';
import { ChartPie, Home, ListChecks, Settings, Wallet } from 'lucide-react-native';
import { colors, fonts, iconSize } from '@/theme';

/**
 * Alt sekme navigasyonu. Seçili sekme vurgu rengiyle belirgin, diğerleri
 * sakindir. Headers gizlenir; her ekran kendi başlığını çizer.
 */
export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Home size={iconSize.md} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finans',
          tabBarIcon: ({ color }) => <Wallet size={iconSize.md} color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Alışkanlıklar',
          tabBarIcon: ({ color }) => <ListChecks size={iconSize.md} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Analiz',
          tabBarIcon: ({ color }) => <ChartPie size={iconSize.md} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => <Settings size={iconSize.md} color={color} />,
        }}
      />
    </Tabs>
  );
}
