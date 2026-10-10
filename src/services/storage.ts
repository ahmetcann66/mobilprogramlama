import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppData,
  Budget,
  CategoryKind,
  Debt,
  DebtPayment,
  Habit,
  HabitCategory,
  HabitCompletion,
  SavingsContribution,
  SavingsGoal,
  Transaction,
  TransactionType,
  UserPreferences,
} from '@/types';
import { collectValid } from '@/utils/collection';
import { isValidDateKey } from '@/utils/date';

/**
 * Yerel kalıcı depolama katmanı.
 *
 * Tüm kullanıcı verisi tek anahtar altında JSON olarak saklanır. Depodan
 * gelen veri "güvenilmeyen" kabul edilir: TypeScript tipleri çalışma
 * zamanında doğrulama yapmadığı için `sanitizeAppData` ile alan alan
 * denetlenir, bozuk kayıtlar sessizce ayıklanır (kullanıcı verisi toptan
 * silinmez).
 */

export const STORAGE_KEY = '@finhabit/appdata';
export const SCHEMA_VERSION = 1;

export const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: '',
  currency: 'TRY',
  weekStartsOn: 1,
  theme: 'dark',
  hapticsEnabled: true,
  reducedMotion: false,
};

export const DEFAULT_BUDGET: Budget = {
  monthlyTotalMinor: 0,
  categoryLimits: {},
};

/** Boş (yeni kullanıcı) veri kümesi. Sahte geçmiş üretilmez. */
export function createInitialData(): AppData {
  return {
    version: SCHEMA_VERSION,
    transactions: [],
    habits: [],
    completions: [],
    goals: [],
    contributions: [],
    debts: [],
    debtPayments: [],
    budget: { ...DEFAULT_BUDGET, categoryLimits: {} },
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

/** Veriyi depoya yazar. Hata fırlatırsa çağıran katman yönetir. */
export async function saveAppData(data: AppData): Promise<void> {
  const serialized = JSON.stringify(data);
  await AsyncStorage.setItem(STORAGE_KEY, serialized);
}

/** Depodan veriyi okur ve doğrular. Hata/boş durumda başlangıç verisi döner. */
export async function loadAppData(): Promise<AppData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return createInitialData();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Bozuk JSON: kullanıcıyı kilitlememek için temiz başlangıç döndür.
    return createInitialData();
  }
  return sanitizeAppData(parsed);
}

/** Depoyu tamamen temizler. */
export async function clearAppData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// --- Çalışma zamanı doğrulama yardımcıları ------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asMinor(value: unknown): number {
  const n = asNumber(value, 0);
  return Math.round(n);
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asDateKey(value: unknown): string | null {
  const s = asString(value);
  return isValidDateKey(s) ? s : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseTransaction(value: unknown): Transaction | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const type = value.type;
  const date = asDateKey(value.date);
  const categoryId = asString(value.categoryId);
  const amount = asMinor(value.amount);

  if (id === '' || categoryId === '' || date === null) return null;
  if (type !== 'income' && type !== 'expense') return null;
  if (amount <= 0) return null;

  const note = typeof value.note === 'string' && value.note !== '' ? value.note : undefined;
  const createdAt = asString(value.createdAt, new Date(0).toISOString());

  const transaction: Transaction = {
    id,
    type: type as TransactionType,
    amount,
    categoryId,
    date,
    createdAt,
    ...(note !== undefined ? { note } : {}),
  };
  return transaction;
}

function parseHabit(value: unknown): Habit | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name).trim();
  if (id === '' || name === '') return null;

  const description =
    typeof value.description === 'string' && value.description !== '' ? value.description : undefined;

  const habit: Habit = {
    id,
    name,
    category: asString(value.category, 'custom') as HabitCategory,
    frequency: value.frequency === 'weekly' ? 'weekly' : 'daily',
    active: asBoolean(value.active, true),
    createdAt: asString(value.createdAt, new Date(0).toISOString()),
    ...(description !== undefined ? { description } : {}),
  };
  return habit;
}

function parseCompletion(value: unknown): HabitCompletion | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const habitId = asString(value.habitId);
  const date = asDateKey(value.date);
  if (id === '' || habitId === '' || date === null) return null;
  return {
    id,
    habitId,
    date,
    completedAt: asString(value.completedAt, new Date(0).toISOString()),
  };
}

function parseGoal(value: unknown): SavingsGoal | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name).trim();
  const targetMinor = asMinor(value.targetMinor);
  if (id === '' || name === '' || targetMinor <= 0) return null;

  const status = value.status;
  const deadline = asDateKey(value.deadline);
  const note = typeof value.note === 'string' && value.note !== '' ? value.note : undefined;
  const roundUpEnabled = asBoolean(value.roundUpEnabled, false);

  const goal: SavingsGoal = {
    id,
    name,
    targetMinor,
    initialMinor: Math.max(0, asMinor(value.initialMinor)),
    status: status === 'completed' || status === 'archived' ? status : 'active',
    createdAt: asString(value.createdAt, new Date(0).toISOString()),
    ...(roundUpEnabled ? { roundUpEnabled: true } : {}),
    ...(deadline !== null ? { deadline } : {}),
    ...(note !== undefined ? { note } : {}),
  };
  return goal;
}

function parseContribution(value: unknown): SavingsContribution | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const goalId = asString(value.goalId);
  const date = asDateKey(value.date);
  const amountMinor = asMinor(value.amountMinor);
  if (id === '' || goalId === '' || date === null || amountMinor <= 0) return null;

  const transactionId =
    typeof value.transactionId === 'string' && value.transactionId !== '' ? value.transactionId : undefined;
  return {
    id,
    goalId,
    amountMinor,
    date,
    createdAt: asString(value.createdAt, new Date(0).toISOString()),
    ...(transactionId !== undefined ? { transactionId } : {}),
  };
}

function parseDebt(value: unknown): Debt | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name).trim();
  const balanceMinor = asMinor(value.balanceMinor);
  if (id === '' || name === '' || balanceMinor <= 0) return null;

  const monthlyRate = asNumber(value.monthlyRate, 0);
  const paymentMinor = Math.max(0, asMinor(value.paymentMinor));
  const note = typeof value.note === 'string' && value.note !== '' ? value.note : undefined;

  const debt: Debt = {
    id,
    name,
    balanceMinor,
    monthlyRate: monthlyRate >= 0 ? monthlyRate : 0,
    paymentMinor,
    archived: asBoolean(value.archived, false),
    createdAt: asString(value.createdAt, new Date(0).toISOString()),
    ...(note !== undefined ? { note } : {}),
  };
  return debt;
}

function parseDebtPayment(value: unknown): DebtPayment | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const debtId = asString(value.debtId);
  const date = asDateKey(value.date);
  const amountMinor = asMinor(value.amountMinor);
  if (id === '' || debtId === '' || date === null || amountMinor <= 0) return null;

  const transactionId =
    typeof value.transactionId === 'string' && value.transactionId !== '' ? value.transactionId : undefined;
  return {
    id,
    debtId,
    amountMinor,
    date,
    createdAt: asString(value.createdAt, new Date(0).toISOString()),
    ...(transactionId !== undefined ? { transactionId } : {}),
  };
}

function parseBudget(value: unknown): Budget {
  if (!isRecord(value)) return { ...DEFAULT_BUDGET, categoryLimits: {} };
  const limits: Record<string, number> = {};
  const rawLimits = value.categoryLimits;
  if (isRecord(rawLimits)) {
    for (const [key, entry] of Object.entries(rawLimits)) {
      const amount = asMinor(entry);
      if (amount > 0) limits[key] = amount;
    }
  }
  return { monthlyTotalMinor: Math.max(0, asMinor(value.monthlyTotalMinor)), categoryLimits: limits };
}

function parsePreferences(value: unknown): UserPreferences {
  if (!isRecord(value)) return { ...DEFAULT_PREFERENCES };
  const weekStartsOn = value.weekStartsOn === 0 ? 0 : 1;
  const theme = value.theme === 'light' ? 'light' : 'dark';
  return {
    displayName: asString(value.displayName, '').slice(0, 40),
    currency: asString(value.currency, 'TRY'),
    weekStartsOn,
    theme,
    hapticsEnabled: asBoolean(value.hapticsEnabled, true),
    reducedMotion: asBoolean(value.reducedMotion, false),
  };
}

/**
 * Depodan/dışarıdan gelen ham veriyi doğrulayıp güvenli bir `AppData`
 * nesnesine dönüştürür. Geçersiz kayıtlar ayıklanır; hiç veri yoksa
 * başlangıç verisi döner.
 */
export function sanitizeAppData(raw: unknown): AppData {
  if (!isRecord(raw)) return createInitialData();

  const transactions = collectValid(asArray(raw.transactions), parseTransaction);

  const habits = collectValid(asArray(raw.habits), parseHabit);

  const validHabitIds = new Set(habits.map((habit) => habit.id));
  const completions = collectValid(asArray(raw.completions), parseCompletion).filter((c) =>
    validHabitIds.has(c.habitId),
  );

  const goals = collectValid(asArray(raw.goals), parseGoal);

  const validGoalIds = new Set(goals.map((goal) => goal.id));
  const contributions = collectValid(asArray(raw.contributions), parseContribution).filter((c) =>
    validGoalIds.has(c.goalId),
  );

  const debts = collectValid(asArray(raw.debts), parseDebt);

  const validDebtIds = new Set(debts.map((debt) => debt.id));
  const debtPayments = collectValid(asArray(raw.debtPayments), parseDebtPayment).filter((p) =>
    validDebtIds.has(p.debtId),
  );

  return {
    version: SCHEMA_VERSION,
    transactions,
    habits,
    completions,
    goals,
    contributions,
    debts,
    debtPayments,
    budget: parseBudget(raw.budget),
    preferences: parsePreferences(raw.preferences),
  };
}

/** Kategori türü doğrulaması için dışa açılan yardımcı (test edilebilir). */
export function isKnownCategoryKind(value: unknown): value is CategoryKind {
  return value === 'income' || value === 'expense' || value === 'both';
}
