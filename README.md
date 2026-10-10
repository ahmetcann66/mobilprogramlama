# FinHabit

Kişisel finans yönetimi ile alışkanlık takibini tek uygulamada birleştiren,
React Native + Expo + TypeScript ile geliştirilmiş bir mobil uygulama.

Veriler **yalnızca cihazda** (AsyncStorage) saklanır; sunucu, hesap veya
internet bağlantısı gerekmez.

## Özellikler

- **Gelir / gider takibi** — kategori, tarih, açıklama ve tür bazlı kayıtlar.
- **Bütçe yönetimi** — aylık toplam bütçe ve kategori limitleri; aşım uyarısı.
- **Alışkanlık takibi** — günlük/haftalık alışkanlıklar, gün-gün tamamlama,
  seri (streak) ve haftalık ilerleme.
- **Tasarruf hedefleri** — hedef, başlangıç birikimi ve katkılar; ilerleme yüzdesi.
  Katkılar gider toplamlarına **dahil edilmez** (muhasebe kuralı).
- **Analiz** — gerçek kayıtlardan üretilen dönemsel grafikler (gelir/gider,
  kategori dağılımı, alışkanlık ve hedef özetleri).
- **Ayarlar** — para birimi, hafta başlangıcı, dokunsal geri bildirim,
  azaltılmış hareket, demo veri, dışa aktarma ve sıfırlama.

## Kurulum

```bash
npm install
npx expo start
```

Ardından terminaldeki QR kodu Expo Go ile okutun veya bir emülatör/cihaz seçin.

> Not: Bu proje `.npmrc` içinde `legacy-peer-deps=true` kullanır.

## Komutlar

| Komut                | Açıklama                          |
| -------------------- | --------------------------------- |
| `npx expo start`     | Geliştirme sunucusunu başlatır    |
| `npx tsc --noEmit`   | TypeScript tip kontrolü           |
| `npm test`           | Birim testleri (Jest)             |
| `npx expo lint`      | ESLint                            |
| `npx expo-doctor`    | Bağımlılık / yapılandırma denetimi |

## Proje Yapısı

```
src/
  app/            Expo Router ekranları (dosya = rota)
  components/     UI, grafik ve alan bileşenleri
  constants/      Varsayılan kategoriler ve alışkanlık meta verileri
  hooks/          useHaptics, useReducedMotion
  services/       Saf iş mantığı + depolama (React'ten bağımsız, test edilebilir)
  store/          useReducer + Context tabanlı global durum
  theme/          Renk, tipografi, boşluk, hareket tokenları
  types/          Veri modelleri ve tipler
  utils/          money (kuruş), date, id, validation
  __tests__/      Birim testleri
```

Mimari ve tasarım kararları için `ARCHITECTURE.md`, test sonuçları için
`TEST_REPORT.md`, sunum için `SUNUM_REHBERI.md` dosyalarına bakın.

## Para Birimi Kuralı

Tüm tutarlar tam sayı **kuruş** olarak saklanır (örn. 12,50 TL = `1250`).
Bu, kayan noktalı toplama hatalarını (0.1 + 0.2) önler. Ayrıştırma ve
biçimlendirme yalnızca `src/utils/money.ts` içinde yapılır.
