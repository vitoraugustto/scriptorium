export interface SlotDef {
  xStart: number;
  xEnd: number;
  yFirst: number;
  yStep: number;
  lines: number;
}

export interface RuleDef {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  red?: boolean;
  marg?: boolean;
}

export interface FolioLayout {
  type: string;
  fontSize: number;
  slots: SlotDef[];
  rules: RuleDef[];
  xCapEnd?: number;
}
