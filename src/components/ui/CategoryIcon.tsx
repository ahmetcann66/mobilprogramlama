import React from 'react';
import {
  BookOpen,
  Bus,
  CircleDashed,
  Coffee,
  Dumbbell,
  Film,
  Gift,
  Heart,
  Home,
  PiggyBank,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import type { CategoryIconKey } from '@/types';

/**
 * Kategori ikon anahtarlarını lucide bileşenlerine eşler. Bilinmeyen bir
 * anahtar gelirse güvenli varsayılana (CircleDashed) düşer; böylece veri
 * kaynaklı hatalı bir kategori kimliği arayüzü bozmaz.
 */
const ICONS: Record<CategoryIconKey, LucideIcon> = {
  cart: ShoppingCart,
  bus: Bus,
  utensils: UtensilsCrossed,
  receipt: Receipt,
  book: BookOpen,
  heart: Heart,
  film: Film,
  shoppingBag: ShoppingBag,
  wallet: Wallet,
  trendingUp: TrendingUp,
  gift: Gift,
  coffee: Coffee,
  home: Home,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
  piggyBank: PiggyBank,
  other: CircleDashed,
};

export interface CategoryIconProps {
  readonly iconKey: CategoryIconKey;
  readonly size?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
}

export function CategoryIcon({
  iconKey,
  size = 20,
  color = '#FFFFFF',
  strokeWidth = 2,
}: CategoryIconProps): React.JSX.Element {
  const Icon = ICONS[iconKey] ?? CircleDashed;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
