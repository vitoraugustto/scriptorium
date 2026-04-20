interface Window {
  electronAPI?: {
    isDebug: boolean;
  };
  __debug?: {
    addGold: (n: number) => void;
    addLetters: (n: number) => void;
    reset: () => void;
  };
}
