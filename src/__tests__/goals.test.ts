import type { SavingsContribution, SavingsGoal } from '@/types';
import {
  computeGoalProgress,
  contributionsFor,
  goalSavedMinor,
  piggyBankGoal,
  resolveGoalStatus,
  roundUpMinor,
  summarizeGoals,
} from '@/services/goals/goals';

function goal(partial: Partial<SavingsGoal> & Pick<SavingsGoal, 'id' | 'targetMinor' | 'initialMinor'>): SavingsGoal {
  return {
    name: partial.id,
    status: 'active',
    createdAt: '2026-05-01T10:00:00.000Z',
    ...partial,
  };
}

function contrib(id: string, goalId: string, amountMinor: number, date: string): SavingsContribution {
  return { id, goalId, amountMinor, date, createdAt: `${date}T10:00:00.000Z` };
}

describe('goalSavedMinor', () => {
  it('başlangıç birikimi ve katkıları toplar', () => {
    const g = goal({ id: 'g1', targetMinor: 1000000, initialMinor: 200000 });
    const contributions = [contrib('c1', 'g1', 100000, '2026-05-02'), contrib('c2', 'g1', 50000, '2026-05-03')];
    expect(goalSavedMinor(g, contributions)).toBe(350000);
  });

  it('başka hedefin katkılarını saymaz', () => {
    const g = goal({ id: 'g1', targetMinor: 1000000, initialMinor: 100000 });
    const contributions = [contrib('c1', 'g2', 500000, '2026-05-02')];
    expect(goalSavedMinor(g, contributions)).toBe(100000);
  });
});

describe('computeGoalProgress', () => {
  it('ilerleme yüzdesini hesaplar', () => {
    const g = goal({ id: 'g1', targetMinor: 1000, initialMinor: 250 });
    const progress = computeGoalProgress(g, []);
    expect(progress.percent).toBe(25);
    expect(progress.ratio).toBeCloseTo(0.25);
    expect(progress.reached).toBe(false);
  });

  it('hedefe ulaşıldığında işaretler', () => {
    const g = goal({ id: 'g1', targetMinor: 1000, initialMinor: 1000 });
    const progress = computeGoalProgress(g, []);
    expect(progress.reached).toBe(true);
    expect(progress.remainingMinor).toBe(0);
  });

  it('aşımı raporlar', () => {
    const g = goal({ id: 'g1', targetMinor: 1000, initialMinor: 1500 });
    const progress = computeGoalProgress(g, []);
    expect(progress.ratio).toBe(1);
    expect(progress.overflowMinor).toBe(500);
  });

  it('sıfır hedefte güvenli değerler döner', () => {
    const g = goal({ id: 'g1', targetMinor: 0, initialMinor: 500 });
    const progress = computeGoalProgress(g, []);
    expect(progress.percent).toBe(0);
    expect(progress.reached).toBe(false);
  });
});

describe('summarizeGoals', () => {
  it('yalnızca aktif hedefleri özetler', () => {
    const goals = [
      goal({ id: 'g1', targetMinor: 1000, initialMinor: 500 }),
      goal({ id: 'g2', targetMinor: 1000, initialMinor: 0, status: 'archived' }),
    ];
    const summary = summarizeGoals(goals, []);
    expect(summary.activeCount).toBe(1);
    expect(summary.targetTotalMinor).toBe(1000);
    expect(summary.savedTotalMinor).toBe(500);
    expect(summary.remainingTotalMinor).toBe(500);
  });
});

describe('contributionsFor', () => {
  it('hedefin katkılarını en yeniden eskiye sıralar', () => {
    const contributions = [
      contrib('c1', 'g1', 100, '2026-05-01'),
      contrib('c2', 'g1', 200, '2026-05-03'),
      contrib('c3', 'g2', 300, '2026-05-02'),
    ];
    expect(contributionsFor(contributions, 'g1').map((c) => c.id)).toEqual(['c2', 'c1']);
  });
});

describe('resolveGoalStatus', () => {
  it('arşivlenmiş hedefi arşivde tutar', () => {
    const g = goal({ id: 'g1', targetMinor: 1000, initialMinor: 0, status: 'archived' });
    expect(resolveGoalStatus(g, computeGoalProgress(g, []))).toBe('archived');
  });

  it('ulaşılan hedefi tamamlandı yapar', () => {
    const g = goal({ id: 'g1', targetMinor: 1000, initialMinor: 1000 });
    expect(resolveGoalStatus(g, computeGoalProgress(g, []))).toBe('completed');
  });
});

describe('roundUpMinor (kumbara)', () => {
  it('kuruşu en yakın 1 TL üzerine tamamlar', () => {
    expect(roundUpMinor(1250)).toBe(50);
    expect(roundUpMinor(1201)).toBe(99);
    expect(roundUpMinor(1)).toBe(99);
  });

  it('tam TL tutarlarda fark üretmez', () => {
    expect(roundUpMinor(1300)).toBe(0);
    expect(roundUpMinor(5000)).toBe(0);
  });

  it('geçersiz tutarlarda 0 döner', () => {
    expect(roundUpMinor(0)).toBe(0);
    expect(roundUpMinor(-100)).toBe(0);
  });
});

describe('piggyBankGoal', () => {
  it('kumbara açık ilk aktif hedefi döndürür', () => {
    const goals = [
      goal({ id: 'g1', targetMinor: 1000, initialMinor: 0 }),
      goal({ id: 'g2', targetMinor: 1000, initialMinor: 0, roundUpEnabled: true }),
      goal({ id: 'g3', targetMinor: 1000, initialMinor: 0, roundUpEnabled: true, status: 'archived' }),
    ];
    expect(piggyBankGoal(goals)?.id).toBe('g2');
  });

  it('kumbara açık hedef yoksa undefined döner', () => {
    const goals = [goal({ id: 'g1', targetMinor: 1000, initialMinor: 0 })];
    expect(piggyBankGoal(goals)).toBeUndefined();
  });
});
