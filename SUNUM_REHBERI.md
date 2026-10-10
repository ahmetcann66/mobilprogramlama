# Sunum Rehberi

Bu belge, üç kişilik sunumu kod üzerinden yürütmek için hazırlanmıştır.
Her bölüm, ilgili kişinin anlatacağı akademik konuları (değişkenler/tipler,
fonksiyonlar/koleksiyonlar, kontrol akışı/hata yakalama) gerçek koda bağlar.

---

## 1) Ahmet Can BOZKURT — Değişkenler, Tipler ve Null Güvenliği

**Ana mesaj:** Uygulama, yanlış veri tipinin çalışma zamanına sızmasını
tip sistemiyle engeller.

- **Union tipler ve literal tipler** — `src/types/models.ts:13`
  `TransactionType = 'income' | 'expense'`. Yön ayrı bir alan; tutar her zaman
  pozitiftir. Bu, "negatif gider" gibi mantık hatalarını baştan engeller.
- **readonly (immutable) modeller** — `src/types/models.ts:28`
  `Transaction` alanları `readonly`. Koleksiyonlar `readonly Transaction[]`.
- **Marka/temel tip** — `Minor` (`src/types/models.ts:11`): para değeri kuruş.
  Neden tam sayı? `src/utils/money.ts:6` ve `ARCHITECTURE.md` "Para tam sayı kuruş".
- **Discriminated union + null güvenliği** — `src/utils/validation.ts:13`
  `ParsedAmount = {ok:true,...} | {ok:false,...}`. Ekranlar `if (!result.ok)`
  ile dallanır; `undefined` erişimi imkânsız.
- **opsiyonel alanların güvenli eklenmesi** — `src/services/storage.ts:131`
  `...(note !== undefined ? { note } : {})` ile `undefined` alan yazılmaz.
- **Sıkı derleyici ayarları** — `tsconfig.json`: `strict`, `noImplicitOverride`.

**Canlı göster:** `npx tsc --noEmit` çalıştırın; hata çıkmadığını gösterin.
Ardından `money.test.ts` içindeki `-5` ve `abc` girdilerinin reddedildiği testi.

---

## 2) Enes Efe TOKTA — Fonksiyonlar ve Koleksiyonlar

**Ana mesaj:** Tüm iş mantığı, React'ten bağımsız **saf fonksiyonlarda**;
koleksiyonlar `map`/`filter`/`reduce` ile değiştirilmeden (immutable) işlenir.

- **Yüksek mertebeli fonksiyonlar** — `src/services/finance/transactions.ts`
  `sumByType` (`filter`+`map`+`sumMinor`), `sumByCategory` (`reduce`),
  `groupByMonth` (`reduce`).
- **Fonksiyonların bileşimi** — `calculateIncome` → `sumByType` → `isWithinRange`.
  Küçük fonksiyonlar tek sorumluluk taşır.
- **Immutable koleksiyonlar** — `sortByDateDesc` girdiyi değiştirmez, kopya
  döndürür (`src/services/finance/transactions.ts:54`).
- **Hedef matematiği tek yerde** — `goalSavedMinor` (`src/services/goals/goals.ts:15`)
  birikim = başlangıç + katkılar. `computeGoalProgress` bunu yüzdeye çevirir.
- **Alışkanlık fonksiyonları** — `toggleCompletion`, `calculateHabitStreak`
  (`while` döngüsüyle geriye sayım), `weekCompletedCount` (`filter`).
- **Global durum** — `src/store/AppDataContext.tsx`: `useReducer` reducer'ı saf;
  her işlem saf servis fonksiyonuna delege edilir.

**Canlı göster:** Analiz ekranındaki kategori dağılımının
`sumByCategory` + `sort` ile oluştuğunu; grafiğin gerçek veriden beslendiğini
(veri yoksa gösterilmediğini) anlatın.

---

## 3) Yusufcan KADAĞAN — Kontrol Akışı ve Hata Yakalama

**Ana mesaj:** Beklenmeyen girdi ve depo hataları uygulamayı çökertmez.

- **switch tabanlı reducer + exhaustiveness** — `src/store/AppDataContext.tsx:64`
  Her `case` bir durum geçişi; `default` dalındaki `never` kontrolü
  (`:201`) yeni eylem unutulursa derlemeyi durdurur.
- **try/catch ile depolama** — `src/services/storage.ts:65` `loadAppData`:
  bozuk JSON'da (`catch`) kullanıcıyı kilitlemeden boş başlangıç döner.
  Yazma hataları `AppDataContext` persist kuyruğunda yakalanır (`:252`).
- **Çalışma zamanı doğrulama** — `sanitizeAppData` (`:244`) ham veriyi
  temizler; yetim `completion`/`contribution` kayıtlarını ayıklar.
- **Form doğrulama akışı** — `parseAmountInput` → `if (!ok) setError(...)`.
  Örn. `src/app/budget-form.tsx` toplam ve kategori limitleri için ayrı hata yolu.
- **Girdi normalizasyonu** — `parseAmountInput` boş/sıfır/negatif durumları
  kontrol akışıyla ayrı mesajlara ayırır (`src/utils/validation.ts:18`).
- **Sınırlı döngü** — `calculateHabitStreak` (`src/services/habits/habits.ts:60`)
  `while`, kayıt bitince durur; bugünü affedip (`:57`) dünkü seriden devam eder.
- **Doğrulama testi** — `storage.test.ts`: bozuk veri, geçersiz tercih,
  yetim kayıt senaryoları.

**Canlı göster:** Ayarlar → "Demo verisi yükle" ve "Tüm verileri sıfırla"
onay diyalogları; ardından `npm test` ile 105 testin geçtiğini gösterin.

---

## Demo Akışı (10 dakika)

1. **Açılış** — uygulama koyu tema, boş başlangıç (sahte veri yok). README özeti.
2. **Finans** — örnek gider/gelir ekleyin; filtreleri (tür/kategori/tarih/arama)
   gösterin; bütçe belirleyip aşım rengini gösterin. *(Enes)*
3. **Alışkanlıklar** — yeni alışkanlık ekleyin, günlük tamamlayın; seri ve
   haftalık ilerleme halkasını gösterin. *(Yusufcan — toggle & streak)*
4. **Hedefler** — hedef oluşturun, katkı ekleyin; ilerleme yüzdesini ve
   "katkı gider değildir" kuralını vurgulayın. *(Enes)*
5. **Analiz** — gerçek veriden oluşan grafikler; veri seçici dönemler. *(Enes)*
6. **Ayarlar & dayanıklılık** — demo veri yükle, sıfırla; hata yakalama. *(Yusufcan)*
7. **Tip güvenliği** — `npx tsc --noEmit` ve `npm test` son çalıştırma. *(Ahmet)*

## Olası Sorular ve Yanıtlar

- **Para neden kuruş?** → Kayan noktalı yuvarlama hatası olmasın diye.
  Bkz. `src/utils/money.ts`, `ARCHITECTURE.md`.
- **Veri nerede tutuluyor?** → Yalnızca AsyncStorage; sunucu yok.
- **Neden Redux yok?** → Ölçek için `useReducer` yeterli; bağımlılık azaltıldı.
- **Katkı neden gider sayılmıyor?** → Çift sayımı önlemek için; para yok olmaz,
  birikime aktarılır. Bkz. `src/services/goals/goals.ts`.
- **Analiz neden boş görünüyor?** → Gerçek veri yoksa sahte grafik gösterilmez;
  Ayarlar'dan demo veri yüklenebilir.
