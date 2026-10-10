/**
 * FinHabit veri modelleri.
 *
 * Tüm parasal değerler TAM SAYI KURUŞ cinsinden saklanır (örn. 12.50 TL = 1250).
 * Kayan noktalı sayıların toplama sırasında yarattığı hassasiyet hatalarını
 * önlemek için bilinçli olarak bu yaklaşım seçilmiştir. Biçimlendirme ve
 * ayrıştırma işlemleri src/utils/money.ts içinde merkezileştirilmiştir.
 */

/** Bir para tutarının kuruş (minor unit) cinsinden tam sayı gösterimi. */
export type Minor = number;

/** İşlem yönü. Union type: yalnızca bu iki değer geçerlidir. */
export type TransactionType = 'income' | 'expense';

/** Kategori türü. `both` hem gelir hem giderde kullanılabilir. */
export type CategoryKind = TransactionType | 'both';

export interface Category {
  readonly id: string;
  readonly name: string;
  /** lucide-react-native ikon anahtarı (bkz. src/constants/categories.ts). */
  readonly icon: CategoryIconKey;
  readonly color: string;
  readonly kind: CategoryKind;
}

export interface Transaction {
  readonly id: string;
  readonly type: TransactionType;
  /** Pozitif tam sayı; yön `type` alanıyla belirlenir. */
  readonly amount: Minor;
  readonly categoryId: string;
  /** Yerel takvime göre 'YYYY-MM-DD'. */
  readonly date: DateKey;
  /** İsteğe bağlı açıklama. */
  readonly note?: string;
  readonly createdAt: IsoTimestamp;
}

/** 'YYYY-MM-DD' biçiminde yerel tarih anahtarı (saat dilimi kaymasız). */
export type DateKey = string;
/** ISO 8601 tam zaman damgası (örn. '2026-05-01T10:30:00.000Z'). */
export type IsoTimestamp = string;

export type HabitFrequency = 'daily' | 'weekly';

export type HabitCategory =
  | 'finance'
  | 'productivity'
  | 'learning'
  | 'health'
  | 'mindfulness'
  | 'custom';

export interface Habit {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly category: HabitCategory;
  readonly frequency: HabitFrequency;
  readonly active: boolean;
  readonly createdAt: IsoTimestamp;
}

/**
 * Bir alışkanlığın belirli bir günde tamamlandığına dair kayıt.
 * (habitId, date) çifti tekildir; aynı gün iki kez tamamlanma sayılmaz.
 */
export interface HabitCompletion {
  readonly id: string;
  readonly habitId: string;
  readonly date: DateKey;
  readonly completedAt: IsoTimestamp;
}

export type GoalStatus = 'active' | 'completed' | 'archived';

export interface SavingsGoal {
  readonly id: string;
  readonly name: string;
  readonly targetMinor: Minor;
  /** Hedef oluşturulurken konulan başlangıç birikimi. */
  readonly initialMinor: Minor;
  /** Kumbara aktifse giderlerin bozuk parası bu hedefe otomatik birikir. */
  readonly roundUpEnabled?: boolean;
  /** İsteğe bağlı hedef tarihi 'YYYY-MM-DD'. */
  readonly deadline?: DateKey;
  readonly note?: string;
  readonly status: GoalStatus;
  readonly createdAt: IsoTimestamp;
}

/**
 * Hedefe sonradan eklenen para. Bu kayıtlar genel gider DEĞİLDİR; sadece
 * birikim hareketidir ve finans toplamlarını etkilemez (bkz. ARCHITECTURE.md).
 * Kumbara katkısıysa kaynağı olan gider işlemi `transactionId` ile bağlanır;
 * işlem silinirse katkı da geri alınır.
 */
export interface SavingsContribution {
  readonly id: string;
  readonly goalId: string;
  readonly amountMinor: Minor;
  /** 'YYYY-MM-DD' yerel tarih anahtarı. */
  readonly date: DateKey;
  readonly createdAt: IsoTimestamp;
  /** Kumbara katkısını üreten gider işlemi kimliği. */
  readonly transactionId?: string;
}

export interface Budget {
  /** Toplam aylık bütçe (kuruş). 0 = bütçe belirlenmemiş. */
  readonly monthlyTotalMinor: Minor;
  /** Kategori bazlı limitler: categoryId -> kuruş. */
  readonly categoryLimits: Readonly<Record<string, Minor>>;
}

/**
 * Faizli kredi / borç kaydı.
 *
 * `balanceMinor` bu borcun AÇILIŞ bakiyesidir; güncel kalan tutar her zaman
 * `balanceMinor - toplam ödeme` olarak hesaplanır (bkz. currentBalanceMinor).
 * Ödeme güncel bakiyeyi mutasyonla değil, ödeme kayıtları üzerinden türetilir;
 * böylece ödeme silme işlemi de tersiyle (geri ekleme) sorunsuz işler.
 */
export interface Debt {
  readonly id: string;
  readonly name: string;
  /** Açılış (kayıt anındaki) toplam kalan borç, kuruş cinsinden. */
  readonly balanceMinor: Minor;
  /** Aylık faiz oranı; oran biçiminde (0.02 = aylık %2). 0 = faizsiz. */
  readonly monthlyRate: number;
  /** Kullanıcının planladığı sabit aylık ödeme (kuruş). 0 = henüz belirlenmedi. */
  readonly paymentMinor: Minor;
  readonly note?: string;
  /** Arşivlendiğinde "ödendi/kapatıldı" kabul edilir ve listede ayrı gösterilir. */
  readonly archived: boolean;
  readonly createdAt: IsoTimestamp;
}

/**
 * Borca yapılan ödeme kaydı. Bu kayıt genel gider DEĞİLDİR; bakiyeyi azaltır.
 * Kullanıcı isterse ödemeyi ayrıca bir gider işlemine bağlayabilir (opsiyonel
 * `transactionId`); ödeme geri alınırsa bağlı işlem de kaldırılır.
 */
export interface DebtPayment {
  readonly id: string;
  readonly debtId: string;
  readonly amountMinor: Minor;
  /** 'YYYY-MM-DD' yerel tarih anahtarı. */
  readonly date: DateKey;
  readonly createdAt: IsoTimestamp;
  /** Bu ödemenin gider işlemi olarak da kaydedildiği işlem kimliği. */
  readonly transactionId?: string;
}

export interface UserPreferences {
  readonly displayName: string;
  /** ISO 4217 para birimi kodu. Varsayılan 'TRY'. */
  readonly currency: string;
  /** Haftanın başlangıç günü: 0 = Pazar, 1 = Pazartesi. */
  readonly weekStartsOn: 0 | 1;
  readonly theme: 'dark' | 'light';
  readonly hapticsEnabled: boolean;
  readonly reducedMotion: boolean;
}

/** Uygulamanın tüm kalıcı durumu tek bir kök nesnede toplanır. */
export interface AppData {
  /** Şema sürümü; göç (migration) mantığı için kullanılır. */
  readonly version: number;
  readonly transactions: readonly Transaction[];
  readonly habits: readonly Habit[];
  readonly completions: readonly HabitCompletion[];
  readonly goals: readonly SavingsGoal[];
  readonly contributions: readonly SavingsContribution[];
  readonly debts: readonly Debt[];
  readonly debtPayments: readonly DebtPayment[];
  readonly budget: Budget;
  readonly preferences: UserPreferences;
}

/**
 * Kategori ikon anahtarları. Bu anahtarlar StatikIcon bileşeninde lucide
 * ikonlarına eşlenir; bilinmeyen anahtar güvenli bir varsayılana düşer.
 */
export type CategoryIconKey =
  | 'cart'
  | 'bus'
  | 'utensils'
  | 'receipt'
  | 'book'
  | 'heart'
  | 'film'
  | 'shoppingBag'
  | 'wallet'
  | 'trendingUp'
  | 'gift'
  | 'coffee'
  | 'home'
  | 'smartphone'
  | 'dumbbell'
  | 'piggyBank'
  | 'other';

export type { DateRange } from './filters';
