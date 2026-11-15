import type { GoalCategory, GoalsWithProgress, WeekHistoryRecord } from '../../types';

export interface GoalCategoryMeta {
  key: GoalCategory;
  label: string;
  unit: string;
  icon: string;
  description: string;
  /** Ring/chart colours: [light, dark] */
  track: [string, string];
  fill: [string, string];
  text: [string, string];
}

export const GOAL_CATEGORIES: GoalCategoryMeta[] = [
  {
    key: 'strength', label: 'Lift', unit: 'lifts', icon: '💪',
    description: 'Strength workouts logged',
    track: ['#E0E7FF', '#1e1b4b'], fill: ['#6366F1', '#818CF8'], text: ['#4338CA', '#a5b4fc'],
  },
  {
    key: 'cardio', label: 'Cardio', unit: 'sessions', icon: '🏃',
    description: 'Runs, rows, rides, swims, walks, tennis… (not golf)',
    track: ['#D1FAE5', '#022c22'], fill: ['#10B981', '#34D399'], text: ['#047857', '#6ee7b7'],
  },
  {
    key: 'golf', label: 'Golf', unit: 'rounds', icon: '⛳',
    description: 'Golf rounds logged',
    track: ['#FEF3C7', '#451a03'], fill: ['#F59E0B', '#FBBF24'], text: ['#B45309', '#fcd34d'],
  },
];

export const goalOf = (w: GoalsWithProgress, k: GoalCategory) => w[`${k}_goal`];
export const completedOf = (w: GoalsWithProgress, k: GoalCategory) => w[`${k}_completed`];
export const metOf = (w: WeekHistoryRecord, k: GoalCategory) => w[`${k}_met`];

export function formatWeekRange(from: string, to: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${new Date(from).toLocaleDateString('en-US', opts)} – ${new Date(to).toLocaleDateString('en-US', opts)}`;
}

export interface CategoryStats {
  weeksWithGoal: number;
  weeksMet: number;
  hitRate: number | null;
  /** Consecutive most-recent completed weeks where the goal was met */
  streak: number;
  /** Average (goal − actual); positive = over-predicting */
  bias: number | null;
  avgCompleted: number | null;
}

/** history must be most-recent first */
export function computeStats(history: WeekHistoryRecord[], k: GoalCategory): CategoryStats {
  const withGoal = history.filter((w) => goalOf(w, k) !== null);
  const weeksMet = withGoal.filter((w) => metOf(w, k)).length;
  let streak = 0;
  for (const w of history) {
    if (metOf(w, k) === true) streak++;
    else break;
  }
  const bias = withGoal.length
    ? withGoal.reduce((s, w) => s + (goalOf(w, k)! - completedOf(w, k)), 0) / withGoal.length
    : null;
  const avgCompleted = history.length
    ? history.reduce((s, w) => s + completedOf(w, k), 0) / history.length
    : null;
  return {
    weeksWithGoal: withGoal.length,
    weeksMet,
    hitRate: withGoal.length ? weeksMet / withGoal.length : null,
    streak,
    bias,
    avgCompleted,
  };
}

export const isDarkMode = () => document.documentElement.classList.contains('dark');
