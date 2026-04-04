import type { SlotDef, RuleDef, FolioLayout } from '../ui/folio/folio.types';
import type { ColDef, LayoutOpts } from './layouts.types';

// ── Folio geometry (SVG viewBox 210×300) ─────────────────────
const _FS  = 6.2;
const _YS  = 9;
const _X0  = 10;
const _X1  = 196;
const _YM  = 22;
const _YF  = 32;
const _YB  = 276;
const _GAP = 14;
const _ROW_GAP = 12;


const makeLayout = (id: string, colDefs: ColDef[], opts: LayoutOpts = {}): FolioLayout => {
  const totalFrac = colDefs.reduce((s, c) => s + c.frac, 0);
  const nCols    = colDefs.length;
  const margW    = 4;
  const totalUsable = (_X1 - _X0) - margW * nCols - _GAP * (nCols - 1);

  let cursor = _X0;
  const colXs = colDefs.map((c, i) => {
    const xStart = cursor + margW;
    const w      = Math.round(totalUsable * c.frac / totalFrac);
    const xEnd   = xStart + w;
    cursor = xEnd + (i < nCols - 1 ? _GAP : 0);
    return { xStart, xEnd };
  });

  const slots: SlotDef[]  = [];
  const rules: RuleDef[]  = [];

  rules.push({ x1: _X0, y1: _YM, x2: _X1, y2: _YM, marg: true });
  rules.push({ x1: _X0, y1: _YB, x2: _X1, y2: _YB, marg: true });

  const maxRows    = Math.max(...colDefs.map(c => c.rows));
  const rowH       = Math.floor((_YB - _YF - _ROW_GAP * (maxRows - 1)) / maxRows);
  const linesPerRow = Math.floor(rowH / _YS) + 1;

  colDefs.forEach((c, ci) => {
    const { xStart, xEnd } = colXs[ci];

    rules.push({ x1: xStart - 4, y1: _X0, x2: xStart - 4, y2: 288, red: true });

    if (c.rows === 1) {
      const totalLines = linesPerRow * maxRows;
      slots.push({ xStart, xEnd, yFirst: _YF, yStep: _YS, lines: totalLines });
      for (let li = 0; li < totalLines; li++)
        rules.push({ x1: xStart - 4, y1: _YF + li * _YS, x2: xEnd, y2: _YF + li * _YS });
    } else {
      for (let ri = 0; ri < c.rows; ri++) {
        const yFirst = _YF + ri * (rowH + _ROW_GAP);
        slots.push({ xStart, xEnd, yFirst, yStep: _YS, lines: linesPerRow });
        for (let li = 0; li < linesPerRow; li++)
          rules.push({ x1: xStart - 4, y1: yFirst + li * _YS, x2: xEnd, y2: yFirst + li * _YS });
        if (ri < c.rows - 1) {
          const sepY = yFirst + (linesPerRow - 1) * _YS + Math.round(_ROW_GAP / 2) + 2;
          rules.push({ x1: xStart - 4, y1: sepY, x2: xEnd, y2: sepY, marg: true });
        }
      }
    }
  });

  const layout: FolioLayout = { type: id, fontSize: _FS, slots, rules };
  if (opts.xCapEnd !== undefined) layout.xCapEnd = opts.xCapEnd;
  return layout;
};

const FOLIO_LAYOUTS: Record<string, FolioLayout> = {
  single: makeLayout('single', [{ frac: 1, rows: 1 }], { xCapEnd: 60 }),
  double: makeLayout('double', [{ frac: 1, rows: 1 }, { frac: 1, rows: 1 }]),
  quad:   makeLayout('quad',   [{ frac: 1, rows: 2 }, { frac: 1, rows: 2 }]),
};

const FOLIO: FolioLayout = FOLIO_LAYOUTS.single;

export { makeLayout, FOLIO_LAYOUTS, FOLIO };
