import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type {
  AppData,
  Budget,
  Debt,
  DebtPayment,
  Habit,
  HabitCompletion,
  SavingsContribution,
  SavingsGoal,
  Transaction,
  UserPreferences,
} from '@/types';
import { addTransaction, deleteTransaction, updateTransaction } from '@/services/finance/transactions';
import { addHabit as addHabitSvc, deleteHabit as deleteHabitSvc, toggleCompletion, updateHabit as updateHabitSvc } from '@/services/habits/habits';
import { addContribution, removeContribution } from '@/services/goals/goals';
import { addDebtPayment as addDebtPaymentSvc, removeDebtPayment as removeDebtPaymentSvc } from '@/services/debts/debts';
import { createInitialData, loadAppData, saveAppData } from '@/services/storage';

/**
 * Global durum yönetimi.
 *
 * React'in yerleşik `useReducer` + `Context` mekanizmaları bu ölçekteki
 * uygulama için yeterlidir; ek bir state kütüphanesi kurulmamıştır. Tüm
 * mutasyonlar tipli `Action` union'ı üzerinden gerçekleşir ve saf servis
 * fonksiyonlarına delege edilir. Her değişiklikten sonra veri otomatik
 * olarak AsyncStorage'a yazılır.
 */

export type LoadStatus = 'loading' | 'ready' | 'error';

interface State {
  readonly status: LoadStatus;
  readonly data: AppData;
  readonly error: string | null;
}

export type Action =
  | { readonly type: 'hydrate'; readonly data: AppData }
  | { readonly type: 'load-failed'; readonly message: string }
  | { readonly type: 'add-transaction'; readonly transaction: Transaction }
  | { readonly type: 'update-transaction'; readonly id: string; readonly patch: Partial<Omit<Transaction, 'id' | 'createdAt'>> }
  | { readonly type: 'delete-transaction'; readonly id: string }
  | { readonly type: 'set-budget'; readonly budget: Budget }
  | { readonly type: 'add-habit'; readonly habit: Habit }
  | { readonly type: 'update-habit'; readonly id: string; readonly patch: Partial<Omit<Habit, 'id' | 'createdAt'>> }
  | { readonly type: 'delete-habit'; readonly id: string }
  | { readonly type: 'toggle-completion'; readonly completion: HabitCompletion }
  | { readonly type: 'add-goal'; readonly goal: SavingsGoal }
  | { readonly type: 'update-goal'; readonly id: string; readonly patch: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>> }
  | { readonly type: 'archive-goal'; readonly id: string }
  | { readonly type: 'delete-goal'; readonly id: string }
  | { readonly type: 'add-contribution'; readonly contribution: SavingsContribution }
  | { readonly type: 'remove-contribution'; readonly id: string }
  | { readonly type: 'add-debt'; readonly debt: Debt }
  | { readonly type: 'update-debt'; readonly id: string; readonly patch: Partial<Omit<Debt, 'id' | 'createdAt'>> }
  | { readonly type: 'toggle-debt-archived'; readonly id: string }
  | { readonly type: 'delete-debt'; readonly id: string }
  | {
      readonly type: 'add-debt-payment';
      readonly payment: DebtPayment;
      /** Ödeme aynı zamanda gider işlemi olarak kaydedilecekse bağlı işlem. */
      readonly transaction?: Transaction;
    }
  | { readonly type: 'remove-debt-payment'; readonly id: string }
  | { readonly type: 'set-preferences'; readonly patch: Partial<UserPreferences> }
  | { readonly type: 'replace-all'; readonly data: AppData };

/** Reducer: durum geçişlerini tek bir switch içinde, tip güvenli biçimde yönetir. */
export function appDataReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { status: 'ready', data: action.data, error: null };

    case 'load-failed':
      return { status: 'error', data: state.data, error: action.message };

    case 'add-transaction':
      return {
        ...state,
        error: null,
        data: { ...state.data, transactions: addTransaction(state.data.transactions, action.transaction) },
      };

    case 'update-transaction':
      return {
        ...state,
        error: null,
        data: { ...state.data, transactions: updateTransaction(state.data.transactions, action.id, action.patch) },
      };

    case 'delete-transaction':
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          transactions: deleteTransaction(state.data.transactions, action.id),
          // İşleme bağlı kumbara (bozuk para) katkıları da geri alınır.
          contributions: state.data.contributions.filter(
            (contribution) => contribution.transactionId !== action.id,
          ),
        },
      };

    case 'set-budget':
      return { ...state, error: null, data: { ...state.data, budget: action.budget } };

    case 'add-habit':
      return {
        ...state,
        error: null,
        data: { ...state.data, habits: addHabitSvc(state.data.habits, action.habit) },
      };

    case 'update-habit':
      return {
        ...state,
        error: null,
        data: { ...state.data, habits: updateHabitSvc(state.data.habits, action.id, action.patch) },
      };

    case 'delete-habit': {
      const next = deleteHabitSvc(state.data.habits, state.data.completions, action.id);
      return { ...state, error: null, data: { ...state.data, habits: next.habits, completions: next.completions } };
    }

    case 'toggle-completion':
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          completions: toggleCompletion(
            state.data.completions,
            action.completion.habitId,
            action.completion.date,
            action.completion.id,
            action.completion.completedAt,
          ),
        },
      };

    case 'add-goal':
      return {
        ...state,
        error: null,
        data: { ...state.data, goals: [action.goal, ...state.data.goals] },
      };

    case 'update-goal':
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          goals: state.data.goals.map((goal) =>
            goal.id === action.id ? { ...goal, ...action.patch, id: goal.id } : goal,
          ),
        },
      };

    case 'archive-goal':
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          goals: state.data.goals.map((goal) =>
            goal.id === action.id ? { ...goal, status: 'archived' as const } : goal,
          ),
        },
      };

    case 'delete-goal':
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          goals: state.data.goals.filter((goal) => goal.id !== action.id),
          contributions: state.data.contributions.filter(
            (contribution) => contribution.goalId !== action.id,
          ),
        },
      };

    case 'add-contribution':
      return {
        ...state,
        error: null,
        data: { ...state.data, contributions: addContribution(state.data.contributions, action.contribution) },
      };

    case 'remove-contribution':
      return {
        ...state,
        error: null,
        data: { ...state.data, contributions: removeContribution(state.data.contributions, action.id) },
      };

    case 'add-debt':
      return {
        ...state,
        error: null,
        data: { ...state.data, debts: [action.debt, ...state.data.debts] },
      };

    case 'update-debt':
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          debts: state.data.debts.map((debt) =>
            debt.id === action.id ? { ...debt, ...action.patch, id: debt.id } : debt,
          ),
        },
      };

    case 'toggle-debt-archived':
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          debts: state.data.debts.map((debt) =>
            debt.id === action.id ? { ...debt, archived: !debt.archived } : debt,
          ),
        },
      };

    case 'delete-debt':
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          debts: state.data.debts.filter((debt) => debt.id !== action.id),
          debtPayments: state.data.debtPayments.filter((payment) => payment.debtId !== action.id),
        },
      };

    case 'add-debt-payment':
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          transactions:
            action.transaction !== undefined
              ? [action.transaction, ...state.data.transactions]
              : state.data.transactions,
          debtPayments: addDebtPaymentSvc(state.data.debtPayments, action.payment),
        },
      };

    case 'remove-debt-payment': {
      const payment = state.data.debtPayments.find((item) => item.id === action.id);
      // Ödemeyle birlikte kaydedilmiş gider işlemi de geri alınır (çift sayımı önler).
      const transactions =
        payment?.transactionId !== undefined
          ? state.data.transactions.filter((tx) => tx.id !== payment.transactionId)
          : state.data.transactions;
      return {
        ...state,
        error: null,
        data: {
          ...state.data,
          transactions,
          debtPayments: removeDebtPaymentSvc(state.data.debtPayments, action.id),
        },
      };
    }

    case 'set-preferences':
      return {
        ...state,
        error: null,
        data: { ...state.data, preferences: { ...state.data.preferences, ...action.patch } },
      };

    case 'replace-all':
      return { status: 'ready', data: action.data, error: null };

    default: {
      // `never` kontrolü: yeni bir action eklenip unutulursa derleyici uyarır.
      const exhaustive: never = action;
      return { ...state, error: `Bilinmeyen eylem: ${JSON.stringify(exhaustive)}` };
    }
  }
}

interface AppDataContextValue {
  readonly status: LoadStatus;
  readonly data: AppData;
  readonly error: string | null;
  readonly dispatch: React.Dispatch<Action>;
  readonly reload: () => Promise<void>;
  readonly replaceAll: (data: AppData) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(appDataReducer, {
    status: 'loading',
    data: createInitialData(),
    error: null,
  });

  // İlk yükleme: depodan oku. Hata olursa uygulama boş veriyle çalışmaya devam eder.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await loadAppData();
        if (!cancelled) dispatch({ type: 'hydrate', data });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Veriler yüklenemedi';
        if (!cancelled) dispatch({ type: 'load-failed', message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Değişiklikleri kalıcı hale getir. Yazımlar sıralı bir kuyruğa alınır ki
  // hızlı ardışık mutasyonlarda depoda tutarsız ara durum oluşmasın.
  const persistQueue = useRef<Promise<void>>(Promise.resolve());
  const hydrated = state.status === 'ready';

  useEffect(() => {
    if (!hydrated) return;
    const snapshot = state.data;
    persistQueue.current = persistQueue.current
      .then(() => saveAppData(snapshot))
      .catch(() => {
        // Depolama hatası uygulamayı kilitlemez; kullanıcı verisi bellekte kalır.
      });
  }, [state.data, hydrated]);

  const reload = useCallback(async () => {
    try {
      const data = await loadAppData();
      dispatch({ type: 'hydrate', data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Veriler yüklenemedi';
      dispatch({ type: 'load-failed', message });
    }
  }, []);

  const replaceAll = useCallback(async (data: AppData) => {
    dispatch({ type: 'replace-all', data });
    await saveAppData(data);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({ status: state.status, data: state.data, error: state.error, dispatch, reload, replaceAll }),
    [state.status, state.data, state.error, reload, replaceAll],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/** Provider dışında kullanılırsa anlamlı hata verir. */
export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (ctx === null) {
    throw new Error('useAppData, AppDataProvider içinde kullanılmalıdır.');
  }
  return ctx;
}
