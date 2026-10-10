# Mimari

Bkz. özet için `README.md`. Bu belge tasarım kararlarını ve katmanların
birbirleriyle ilişkisini açıklar.

## Katmanlar

```
        ┌──────────────────────────────────────────────┐
        │                  app/ (ekranlar)               │  Expo Router
        │  Tabs: index, finance, habits, insights,       │  görünüm + kullanıcı
        │  settings   •  Modallar: *-form, goal-detail   │  etkileşimi
        └───────────────┬───────────────────────────────┘
                        │  useAppData() / dispatch()
        ┌───────────────▼───────────────────────────────┐
        │           store/AppDataContext.tsx             │  useReducer + Context
        │  Action union → saf servis fonksiyonlarına      │  tek yönlü veri akışı
        └───────────────┬───────────────────────────────┘
                        │
        ┌───────────────▼───────────────┐   ┌───────────┐
        │   services/ (saf iş mantığı)   │   │  utils/    │
        │  finance • habits • goals      │◄──┤ money      │
        │  storage • seed                │   │ date/id/…  │
        └───────────────┬───────────────┘   └───────────┘
                        │
        ┌───────────────▼───────────────┐
        │      AsyncStorage (yerel)      │
        └────────────────────────────────┘
```

- **app/** yalnızca sunum ve kullanıcı etkileşimini yönetir.
- **services/** React'ten tamamen bağımsız, **saf fonksiyonlardan** oluşur.
  Bu sayede arayüz olmadan birim testleriyle doğrulanabilir.
- **store/** tüm mutasyonları tipli `Action` union'ı üzerinden alır ve
  servis fonksiyonlarına delege eder. Her değişiklikten sonra veri otomatik
  olarak depoya yazılır (sıralı kuyruk ile).

## Neden useReducer + Context?

Bu ölçekteki bir uygulama için Redux/Zustand gibi ek bir bağımlılığa gerek
yoktur. `useReducer`, durum geçişlerini tek bir `switch` içinde toplar; her
`Action` tipi derleyici tarafından denetlenir ve `default` dalındaki `never`
kontrolü sayesinde yeni bir eylem eklenip unutulursa **derleme hatası** oluşur.

## Veri Modeli ve Doğrulama

Modeller `src/types/models.ts` içinde tanımlıdır ve `readonly` alanlarla
değiştirilemez (immutable) tutulur. Depodan okunan ham veri, `sanitizeAppData`
ile **çalışma zamanında** doğrulanır:

- Geçersiz kayıtlar ayıklanır (eksik alan, hatalı tarih, sıfır/negatif tutar).
- Başka bir varlığa ait olmayan ilişkili kayıtlar (yetim `completion` veya
  `contribution`) temizlenir.
- Şema sürümü (`SCHEMA_VERSION`) normalize edilir.

Bozuk JSON durumunda bile uygulama çökmez; boş başlangıç verisi ile açılır.

## Önemli Tasarım Kararları

1. **Para tam sayı kuruş.** Ondalık sayı yerine kuruş saklanır; toplama
   işlemleri `sumMinor` ile yapılır. Yuvarlama hataları ortadan kalkar.
2. **Tasarruf katkıları gider değildir.** Bir hedefe eklenen para gider
   toplamını etkilemez (çift sayımı önler). Tek kaynak: `goalSavedMinor`.
3. **Alışkanlık tamamlaması (habitId, date) tekil.** Aynı gün iki kez
   tamamlama sayılmaz; seri ve yüzde hesapları tutarlı kalır.
4. **Seri (streak) bugünü affeder.** Bugün henüz tamamlanmadıysa seri bozulmaz,
   dünkü seriden devam eder; ancak eksik günler asla başarı sayılmaz.
5. **Demo veri varsayılan değildir.** Analiz ekranı gerçek kayıtlardan beslenir;
   veri yoksa sahte grafik gösterilmez. Demo veri yalnızca Ayarlar'dan yüklenir.
6. **Azaltılmış hareket.** `useReducedMotion`, sistem tercihini veya kullanıcı
   ayarını dikkate alarak animasyonları sadeleştirir.

## Yönlendirme (Expo Router)

`src/app/` altındaki her dosya bir rotadır. S ekme grubu `(tabs)` altındadır.
Form ekranları kök Stack üzerinde modal olarak sunulur:

```
(tabs)/index  → Ana sayfa (özet + hızlı işlemler)
(tabs)/finance → İşlem listesi, filtreler, bütçe
(tabs)/habits  → Alışkanlıklar ve günlük takip
(tabs)/insights → Dönemsel analizler
(tabs)/settings → Tercihler ve veri yönetimi
goal-detail    → Hedef detayı + katkı ekleme (modal)
transaction-form / habit-form / goal-form / budget-form → Kayıt formları (modal)
```

## Animasyon

`react-native-reanimated` kullanılır. Süreler ve eğriler `src/theme/motion.ts`
içinde merkezileştirilmiştir. Grafikler (çubuk/donut) girişte kademeli
(`stagger`) olarak canlanır. Reanimated 4, `react-native-worklets` üzerine
kuruludur ve babel preset'i tarafından otomatik yapılandırılır.
