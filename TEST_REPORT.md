# Test Raporu

## Özet

| Kontrol                       | Komut              | Sonuç   |
| ----------------------------- | ------------------ | ------- |
| Tip kontrolü (TypeScript)     | `npx tsc --noEmit` | ✅ Geçti |
| Birim testleri (Jest)         | `npm test`         | ✅ 105/105 geçti |
| ESLint                        | `npx expo lint`    | ✅ Hata yok |
| Expo yapılandırma denetimi    | `npx expo-doctor`  | ✅ 21/21 geçti |

Testler, iş mantığının React'ten bağımsız **saf servis katmanını** ve
yardımcı fonksiyonları kapsar. Jest yapılandırması `jest-expo` preset'ini
ve `moduleNameMapper` ile `@/*` yol takma adını kullanır.

## Test Dosyaları

| Dosya                       | Kapsam                                                                 |
| --------------------------- | ---------------------------------------------------------------------- |
| `money.test.ts`             | `parseAmountToMinor`, `formatMinor(Plain)`, `sumMinor`, `ratio`         |
| `validation.test.ts`        | `parseAmountInput` (union sonuç), `validateRequired/Name`, `safePercent`|
| `date.test.ts`              | `toDateKey`, `parseDateKey`, `addDays`, `daysBetween`, `parseDateInput`, `rangeForPreset` |
| `transactions.test.ts`      | Gelir/gider/net, filtreleme (tür/kategori/arama/aralık), sıralama, `sumByCategory`, `groupByMonth` |
| `budget.test.ts`            | `computeBudgetUsage` (bütçe var/yok, aşım), `computeCategoryBudgets`, yardımcılar |
| `habits.test.ts`            | Toggle, seri (streak), günlük yüzde, haftalık ilerleme, kaskad silme    |
| `goals.test.ts`             | `goalSavedMinor`, `computeGoalProgress` (ulaşma/aşım/sıfır hedef), özet |
| `storage.test.ts`           | `sanitizeAppData` (bozuk veri, yetim kayıt, geçersiz tercih), `isKnownCategoryKind` |

## Öne Çıkan Senaryolar

- **Para hassasiyeti:** `0,4 + 0,6` tam sayı kuruşta `1` sonucunu verir.
- **Türkçe girdi:** Hem `12,50` hem `1.234,56` doğru ayrıştırılır; `-5` ve
  harfler reddedilir.
- **Saat dilimi güvenliği:** `addDays('2026-02-28', 1)` → `'2026-03-01'`.
- **Seri devamlılığı:** Bugün tamamlanmadıysa seri dünkü değerden devam eder;
  aradaki boşluk seriyi keser.
- **Yetim kayıt temizliği:** Var olmayan alışkanlığa/hedefe bağlı tamamlanma
  ve katkılar depodan temizlenir.
- **Bütçe yokken güvenli davranış:** Bütçe tanımsızken `hasBudget=false`,
  kullanım oranı `0`, aşım uyarısı yok.

## Testleri Çalıştırma

```bash
npm test                 # tüm testler
npm test -- --watch      # izleme modu
npm test -- src/__tests__/money.test.ts   # tek dosya
```

## Notlar

- `@react-native/jest-preset` sürümü, `react-native` (0.86.3) ile eşleşecek
  şekilde `0.86.3` olarak sabitlenmiştir.
- `@types/jest` sürümü, `jest-expo`'nun beklediği `~29.5.14` sürümüne sabitlenmiştir.
- Storage testinde AsyncStorage, resmi `async-storage-mock` ile taklit edilir.
