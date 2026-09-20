export type SoundId = 'quill' | 'pageTurn' | 'codexBind' | 'upgrade';

export interface SoundSpec {
  url: string;
  gain: number;
  pool: number;
  minIntervalMs: number;
  // when set, play a slice of this many seconds from a random offset
  slice?: number;
}

export interface SoundSettings {
  volume: number;
  muted: boolean;
}
