interface Window {
  saveAPI?: {
    read: () => Promise<string | null>;
    write: (data: string) => Promise<void>;
    wipe: () => Promise<void>;
    quarantine: () => Promise<void>;
    cache: (data: string) => void;
  };
  __debug?: {
    addGold: (n: number) => void;
    addLetters: (n: number) => void;
    reset: () => void;
    save: () => Promise<void>;
    load: () => Promise<void>;
    wipe: () => Promise<void>;
    pageCapacity: () => number;
  };
}
