import type { PersistedState } from '../state/state.types';

export interface SaveEnvelope {
  version: number;
  savedAt: number;
  state: PersistedState;
}

export type LoadOutcome =
  | { kind: 'loaded'; state: PersistedState }
  | { kind: 'fresh' }
  | { kind: 'rejected'; reason: 'parse' | 'shape' | 'future' };

export type Migration = (s: Record<string, unknown>) => Record<string, unknown>;
