import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useAppData } from '@/store/AppDataContext';

/**
 * Dokunsal geri bildirim (haptics) yardımcısı.
 *
 * Kullanıcı tercihi kapalıysa veya desteklenmeyen ortamda (web) sessizce
 * yutulur; hiçbir zaman işlevi bozmaz. Tüm çağrılar promise döndürdüğü
 * için `void` ile ateşlenir ve hatalar yok sayılır.
 */
export function useHaptics(): {
  readonly light: () => void;
  readonly success: () => void;
  readonly warning: () => void;
} {
  const { data } = useAppData();
  const enabled = data.preferences.hapticsEnabled;

  const light = useCallback(() => {
    if (!enabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, [enabled]);

  const success = useCallback(() => {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [enabled]);

  const warning = useCallback(() => {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  }, [enabled]);

  return { light, success, warning };
}
