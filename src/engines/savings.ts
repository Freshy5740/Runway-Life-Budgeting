import type { Cents } from '../lib/money'

// Envelopes and the emergency fund.

export interface EnvelopeInput {
  targetCents: Cents
  balanceCents: Cents
  autoSaveWeeklyCents: Cents
}

/** The total weekly auto-save across every envelope; it comes out of the weekly budget. */
export function weeklyAutoSave(envelopes: readonly EnvelopeInput[]): Cents {
  return envelopes.reduce((sum, envelope) => sum + envelope.autoSaveWeeklyCents, 0)
}

/** Whole-number percent toward the target, capped at 100. */
export function progressPercent(
  envelope: Pick<EnvelopeInput, 'targetCents' | 'balanceCents'>,
): number {
  if (envelope.targetCents <= 0) return 0
  return Math.min(100, Math.round((100 * envelope.balanceCents) / envelope.targetCents))
}
