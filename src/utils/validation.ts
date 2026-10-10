import type { Minor } from '@/types';
import { parseAmountToMinor } from './money';

/**
 * Form doğrulama yardımcıları.
 *
 * Doğrulayıcılar başarı durumunda `null`, hata durumunda açıklayıcı Türkçe
 * mesaj döndürür. Bu sade sözleşme sayesinde ekranlarda `if (error)` ile
 * kontrol akışı kolayca kurulur.
 */

/** Ayrıştırma sonucu: hata durumunu tip sistemiyle zorunlu kılan union type. */
export type ParsedAmount =
  | { readonly ok: true; readonly minor: Minor }
  | { readonly ok: false; readonly error: string };

/** Metin tutarını doğrulayıp kuruşa çevirir. */
export function parseAmountInput(raw: string): ParsedAmount {
  if (raw.trim() === '') {
    return { ok: false, error: 'Tutar gerekli' };
  }
  const minor = parseAmountToMinor(raw);
  if (minor === null) {
    return { ok: false, error: 'Geçerli bir tutar girin (örn. 1250,50)' };
  }
  if (minor === 0) {
    return { ok: false, error: 'Tutar sıfırdan büyük olmalı' };
  }
  return { ok: true, minor };
}

/** Zorunlu metin alanı doğrulaması. */
export function validateRequired(value: string, label: string): string | null {
  if (value.trim() === '') return `${label} gerekli`;
  return null;
}

/** İsim/başlık alanı için uzunluk denetimi. */
export function validateName(value: string, label: string, max = 40): string | null {
  const required = validateRequired(value, label);
  if (required !== null) return required;
  if (value.trim().length > max) return `${label} en fazla ${max} karakter olabilir`;
  return null;
}

/** Hedef tutarı: sıfır veya negatif olamaz. */
export function validatePositiveMinor(minor: Minor, label = 'Tutar'): string | null {
  if (!Number.isFinite(minor)) return `${label} geçersiz`;
  if (minor <= 0) return `${label} sıfırdan büyük olmalı`;
  return null;
}

/** Boş liste durumunda sıfıra bölme hatasını önleyen yüzde hesabı. */
export function safePercent(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}
