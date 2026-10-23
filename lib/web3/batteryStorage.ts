import { CartridgeBattery, Chog, TierType } from '@/types/chog';
import { generateProceduralChog } from '@/lib/chogProvider';
import { SeededRandom } from '@/game/seededRandom';

const STORAGE_KEYS = {
  BATTERY_PREFIX: 'chogathon_battery_',
  WALLET_TRIAL_CHOGS: 'chogathon_wallet_trial_chogs_',
  CLAIMED_BOUNTY: 'chogathon_wallet_claimed_chog_',
};

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Returns battery info for a given token ID.
 * Permanent cartridges (like #969 or official Chogs) have infinite battery unless explicitly flagged as a trial.
 */
export function getCartridgeBattery(tokenId: number): CartridgeBattery {
  if (!isClient()) {
    return { maxRuns: 7, runsRemaining: 7, isBurned: false, isTrial: true };
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.BATTERY_PREFIX}${tokenId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }

  // Official fixture #969 is a permanent cartridge by default
  if (tokenId === 969) {
    return { maxRuns: Infinity, runsRemaining: 999999, isBurned: false, isTrial: false };
  }

  // Default trial battery: 7 runs
  return { maxRuns: 7, runsRemaining: 7, isBurned: false, isTrial: true };
}

/**
 * Deducts 1 run from the cartridge battery.
 * If runsRemaining hits 0, marks isBurned = true.
 */
export function consumeCartridgeRun(tokenId: number): CartridgeBattery {
  const current = getCartridgeBattery(tokenId);

  if (!current.isTrial || current.maxRuns === Infinity) {
    return current; // Permanent cartridge never depletes
  }

  const nextRuns = Math.max(0, current.runsRemaining - 1);
  const updated: CartridgeBattery = {
    ...current,
    runsRemaining: nextRuns,
    isBurned: nextRuns <= 0,
  };

  if (isClient()) {
    try {
      localStorage.setItem(`${STORAGE_KEYS.BATTERY_PREFIX}${tokenId}`, JSON.stringify(updated));
    } catch {}
  }

  return updated;
}

/**
 * Recharges a cartridge back to 7 runs (used for hackathon resets or $CHOG token recharge)
 */
export function rechargeCartridge(tokenId: number, runs = 7): CartridgeBattery {
  const updated: CartridgeBattery = {
    maxRuns: runs,
    runsRemaining: runs,
    isBurned: false,
    isTrial: true,
  };

  if (isClient()) {
    try {
      localStorage.setItem(`${STORAGE_KEYS.BATTERY_PREFIX}${tokenId}`, JSON.stringify(updated));
    } catch {}
  }

  return updated;
}

/**
 * Roll a Gacha luck-based Trial Chog (Common 60%, Rare 25%, Epic 12%, Legendary 3%)
 */
export function rollGachaTrialChog(walletAddress: string): {
  chog: Chog;
  tier: 'common' | 'rare' | 'epic' | 'legendary';
} {
  const roll = Math.random() * 100;
  let tier: 'common' | 'rare' | 'epic' | 'legendary' = 'common';

  if (roll >= 97) {
    tier = 'legendary';
  } else if (roll >= 85) {
    tier = 'epic';
  } else if (roll >= 60) {
    tier = 'rare';
  } else {
    tier = 'common';
  }

  // Generate unique Token ID for trial cartridge (2000 - 9999)
  const trialTokenId = 2000 + Math.floor(Math.random() * 7999);
  const baseChog = generateProceduralChog(trialTokenId, true);

  // Apply rolled tier override
  const tierCapitalized = tier.charAt(0).toUpperCase() + tier.slice(1);
  baseChog.traits.tier = tierCapitalized;
  baseChog.name = `${tierCapitalized} Chog #${trialTokenId} [TRIAL]`;
  baseChog.description = `Luck-rolled ${tierCapitalized} Trial Cartridge on Monad. 7 runs before battery burns.`;

  const battery: CartridgeBattery = {
    maxRuns: 7,
    runsRemaining: 7,
    isBurned: false,
    isTrial: true,
  };
  baseChog.battery = battery;

  // Persist to storage
  if (isClient()) {
    try {
      // Save battery
      localStorage.setItem(`${STORAGE_KEYS.BATTERY_PREFIX}${trialTokenId}`, JSON.stringify(battery));

      // Save to wallet's trial collection
      const existing = getWalletTrialChogs(walletAddress);
      existing.unshift(baseChog);
      localStorage.setItem(`${STORAGE_KEYS.WALLET_TRIAL_CHOGS}${walletAddress.toLowerCase()}`, JSON.stringify(existing));
    } catch {}
  }

  return { chog: baseChog, tier };
}

/**
 * Get all trial cartridges associated with a wallet
 */
export function getWalletTrialChogs(walletAddress: string): Chog[] {
  if (!isClient() || !walletAddress) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.WALLET_TRIAL_CHOGS}${walletAddress.toLowerCase()}`);
    if (raw) {
      const parsed: Chog[] = JSON.parse(raw);
      // Re-hydrate battery statuses in case any were played
      return parsed.map((c) => ({
        ...c,
        battery: getCartridgeBattery(c.tokenId),
      }));
    }
  } catch {}
  return [];
}

/**
 * Get accumulated $CHOG claimed by this wallet
 */
export function getWalletClaimedChog(walletAddress: string): number {
  if (!isClient() || !walletAddress) return 0;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.CLAIMED_BOUNTY}${walletAddress.toLowerCase()}`);
    return raw ? parseFloat(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Add claimed $CHOG bounty to wallet balance
 */
export function addWalletClaimedChog(walletAddress: string, amount: number): number {
  if (!isClient() || !walletAddress) return amount;
  try {
    const current = getWalletClaimedChog(walletAddress);
    const updated = Number((current + amount).toFixed(3));
    localStorage.setItem(`${STORAGE_KEYS.CLAIMED_BOUNTY}${walletAddress.toLowerCase()}`, updated.toString());
    return updated;
  } catch {
    return amount;
  }
}
