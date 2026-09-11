export interface Persistence {
  init: () => void;
  flush: () => void;
}
