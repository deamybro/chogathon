import { RunResults } from '@/types/chog';

export type CabinetMilestone = 'Fresh Cabinet' | 'Haunted Cabinet' | 'Legendary Cabinet';

export interface CabinetStatus {
  milestone: CabinetMilestone;
  skullCount: number;
  badgeColor: string;
  glowClass: string;
}

const STORAGE_KEYS = {
  BEST_SCORE_PREFIX: 'chog969_best_score_',
  SKULLS_PREFIX: 'chog969_skulls_',
  RECENT_RUNS: 'chog969_recent_runs',
  SOUND_ENABLED: 'chog969_sound_enabled',
  LUCID_DREAM_ENABLED: 'chog969_lucid_dream_enabled',
};

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Get personal best score for a specific tokenId
 */
export function getBestScore(tokenId: number): number {
  if (!isClient()) return 0;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.BEST_SCORE_PREFIX}${tokenId}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Save personal best score if higher
 */
export function recordScore(tokenId: number, score: number): number {
  if (!isClient()) return score;
  try {
    const currentBest = getBestScore(tokenId);
    if (score > currentBest) {
      localStorage.setItem(`${STORAGE_KEYS.BEST_SCORE_PREFIX}${tokenId}`, score.toString());
      return score;
    }
    return currentBest;
  } catch {
    return score;
  }
}

/**
 * Get Skull Count (failed runs) for a token ID
 */
export function getSkullCount(tokenId: number): number {
  if (!isClient()) return 0;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SKULLS_PREFIX}${tokenId}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Increment Skull Count when a player dies before surviving the 60s
 */
export function incrementSkullCount(tokenId: number): number {
  if (!isClient()) return 1;
  try {
    const count = getSkullCount(tokenId) + 1;
    localStorage.setItem(`${STORAGE_KEYS.SKULLS_PREFIX}${tokenId}`, count.toString());
    return count;
  } catch {
    return 1;
  }
}

/**
 * Derive cosmetic cabinet status from Skull Count
 * 0: Fresh Cabinet
 * 10: Haunted Cabinet
 * 50: Legendary Cabinet
 */
export function getCabinetStatus(skullCount: number): CabinetStatus {
  if (skullCount >= 50) {
    return {
      milestone: 'Legendary Cabinet',
      skullCount,
      badgeColor: 'text-amber-400 border-amber-500 bg-amber-950/40',
      glowClass: 'shadow-[0_0_25px_rgba(234,179,8,0.35)] border-amber-500',
    };
  }
  if (skullCount >= 10) {
    return {
      milestone: 'Haunted Cabinet',
      skullCount,
      badgeColor: 'text-purple-400 border-purple-500 bg-purple-950/40',
      glowClass: 'shadow-[0_0_20px_rgba(168,85,247,0.3)] border-purple-500',
    };
  }
  return {
    milestone: 'Fresh Cabinet',
    skullCount,
    badgeColor: 'text-emerald-400 border-emerald-500 bg-emerald-950/40',
    glowClass: 'shadow-[0_0_15px_rgba(34,197,94,0.2)] border-emerald-500/60',
  };
}

/**
 * Sound preference
 */
export function getSoundEnabled(): boolean {
  if (!isClient()) return true;
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val !== null ? val === 'true' : true;
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, enabled.toString());
  } catch {}
}

/**
 * Optional cosmetic Lucid Dream ($CHOG) theme
 * Clearly non-financial, disabled by default.
 */
export function getLucidDreamEnabled(): boolean {
  if (!isClient()) return false;
  try {
    const val = localStorage.getItem(STORAGE_KEYS.LUCID_DREAM_ENABLED);
    return val === 'true';
  } catch {
    return false;
  }
}

export function setLucidDreamEnabled(enabled: boolean): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.LUCID_DREAM_ENABLED, enabled.toString());
  } catch {}
}

/**
 * Record completed or failed run
 */
export function saveRecentRun(result: RunResults): void {
  if (!isClient()) return;
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEYS.RECENT_RUNS);
    const runs: RunResults[] = existingRaw ? JSON.parse(existingRaw) : [];
    runs.unshift(result);
    // Keep last 15 runs
    localStorage.setItem(STORAGE_KEYS.RECENT_RUNS, JSON.stringify(runs.slice(0, 15)));
  } catch {}
}

export function getRecentRuns(): RunResults[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_RUNS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
