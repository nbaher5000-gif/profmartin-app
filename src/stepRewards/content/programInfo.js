/**
 * programInfo.js
 * ------------------------------------------------------------------
 * Reward-tier / anti-fraud constants for the step-rewards module, mirrored
 * from the stepapp backend's src/types/index.ts. Lets the UI show the full
 * reward ladder before the buyer reaches each tier, without a network call.
 * If the backend's numbers ever change, update both places together.
 */

export const REWARD_TIERS = [
  { tier: 1, steps: 50_000, amountToman: 1_000_000 },
  { tier: 2, steps: 100_000, amountToman: 1_000_000 },
  { tier: 3, steps: 150_000, amountToman: 1_000_000 },
];

export const TOTAL_REWARD_TOMAN = REWARD_TIERS.reduce((sum, t) => sum + t.amountToman, 0);
export const MAX_TIER_STEPS = REWARD_TIERS[REWARD_TIERS.length - 1].steps;

/** Anti-fraud limit buyers may actually notice in daily use. */
export const DAILY_STEP_CAP = 25_000;

/**
 * WhatsApp number for support, digits only incl. country code, no '+' or spaces.
 * TODO (business, not engineering): replace with the real martinbot/profmartin
 * support WhatsApp number before shipping.
 */
export const SUPPORT_WHATSAPP_NUMBER = 'REPLACE_WITH_SUPPORT_WHATSAPP_NUMBER';

export function faNumber(n) {
  return n.toLocaleString('fa-IR');
}
