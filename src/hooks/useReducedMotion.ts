import { useReducedMotion as useSystemReducedMotion } from 'react-native-reanimated';
import { useAppData } from '@/store/AppDataContext';

/**
 * Hareket tercihini birleştirir: işletim sistemi "Reduce Motion" ayarı
 * VEYA uygulama içi tercih açıksa animasyonlar sadeleştirilir. Bu hook
 * animasyonların erişilebilirlik gereksinimine uymasını sağlar.
 */
export function useReducedMotion(): boolean {
  const systemPrefers = useSystemReducedMotion();
  const { data } = useAppData();
  return systemPrefers || data.preferences.reducedMotion;
}
