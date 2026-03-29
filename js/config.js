"use strict";

const Config = (() => {
  const PAGES_PER_CODEX = 300;
  const AUTO_TICK_MS = 50;

  const SCRIBE_TITLES = [
    "Novice Scribe",
    "Skilled Copyist",
    "Master Calligrapher",
    "Keeper of the Scriptorium",
    "Royal Illuminator",
    "Eternal Archivist",
  ];

  const LOREM = [
    "veritas",
    "lumen",
    "anima",
    "gloria",
    "pax",
    "virtus",
    "sapientia",
    "fides",
    "gratia",
    "caritas",
    "honor",
    "lex",
    "cor",
    "vita",
    "mors",
    "terra",
    "caelum",
    "aqua",
    "ignis",
    "spiritus",
    "tempus",
    "memoria",
    "liber",
    "scriptura",
    "pagina",
    "codex",
    "calamus",
    "atramento",
    "monasterium",
    "claustrum",
    "oratio",
    "cantus",
    "silentium",
    "labor",
    "sanctus",
    "beatus",
    "deus",
    "dominus",
    "rex",
    "regina",
    "miles",
  ];

  // ── Folio geometry (SVG viewBox 210×300) ─────────────────────
  // All layouts share identical font size and line spacing.
  // Define layouts with makeLayout(id, colDefs, opts):
  //   colDefs: array of column definitions
  //     each: { frac, rows }
  //       frac  — relative width fraction (e.g. [1,1] = equal halves, [2,1] = 2/3 + 1/3)
  //       rows  — number of vertical sections in this column (1 = full height, 2 = split, etc.)
  //   opts.xCapEnd — override for illuminated capital (single layout only)
  //
  // makeLayout computes:
  //   - identical yFirst for all rows across all columns
  //   - identical bottom margin position for all layouts
  //   - ruled lines scoped per column (no cross-column overlap)
  //   - red margin lines at left edge of each column

  const _FS  = 6.2;  // font size — fixed
  const _YS  = 9;    // line step — fixed
  const _X0  = 10;   // page left edge
  const _X1  = 196;  // page right edge
  const _YM  = 22;   // top margin rule y
  const _YF  = 32;   // first text line y (= _YM + 10 padding)
  const _YB  = 276;  // bottom margin rule y
  const _GAP = 14;   // gutter between columns (px)
  const _ROW_GAP = 12; // gap between row-blocks within a column

  const makeLayout = (id, colDefs, opts = {}) => {
    const totalFrac = colDefs.reduce((s, c) => s + c.frac, 0);
    // usable text width: full width minus gutters between columns
    // each column has a 4px red-margin inset on its left, so text starts at xStart
    // gutter between cols = _GAP (space between xEnd of col N and xStart of col N+1)
    const nCols    = colDefs.length;
    const margW    = 4; // space reserved left of each col for red margin line
    const totalUsable = (_X1 - _X0) - margW * nCols - _GAP * (nCols - 1);

    // compute xStart/xEnd for each column
    let cursor = _X0;
    const colXs = colDefs.map((c, i) => {
      const xStart = cursor + margW;
      const w      = Math.round(totalUsable * c.frac / totalFrac);
      const xEnd   = xStart + w;
      cursor = xEnd + (i < nCols - 1 ? _GAP : 0);
      return { xStart, xEnd };
    });

    const slots  = [];
    const rules  = [];

    // top/bottom margin rules — full width
    rules.push({ x1: _X0, y1: _YM, x2: _X1, y2: _YM, marg: true });
    rules.push({ x1: _X0, y1: _YB, x2: _X1, y2: _YB, marg: true });

    // linesPerRow derived from vertical space — ensures uniform yFirst/yLast across all columns.
    const maxRows    = Math.max(...colDefs.map(c => c.rows));
    const rowH       = Math.floor((_YB - _YF - _ROW_GAP * (maxRows - 1)) / maxRows);
    const linesPerRow = Math.floor(rowH / _YS) + 1;

    colDefs.forEach((c, ci) => {
      const { xStart, xEnd } = colXs[ci];

      // red margin line for this column
      rules.push({ x1: xStart - 4, y1: _X0, x2: xStart - 4, y2: 288, red: true });

      if (c.rows === 1) {
        // single block spanning the full height — lines fill from _YF downward
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

    const layout = { type: id, fontSize: _FS, slots, rules };
    if (opts.xCapEnd) layout.xCapEnd = opts.xCapEnd;
    return layout;
  };

  const FOLIO_LAYOUTS = {
    single: makeLayout('single', [{ frac:1, rows:1 }], { xCapEnd: 60 }),
    double: makeLayout('double', [{ frac:1, rows:1 }, { frac:1, rows:1 }]),
    quad:   makeLayout('quad',   [{ frac:1, rows:2 }, { frac:1, rows:2 }]),
  };

  const FOLIO = FOLIO_LAYOUTS.single;

  const GOLD_UPGRADES = [
    {
      id: 'g_quill',
      name: 'Goose Quill',
      desc: 'A well-cut quill from the wing of a grey goose — the scribe\'s most faithful instrument',
      baseCost: 5,
      costMult: 2.3,
      max: 10,
      effect: 'clickAdd',
      val: 1,
    },
  ];

  const SALT_UPGRADES = [
    {
      id: "s_bonus1",
      name: "Salt Cellar",
      desc: "Permanent +30% bonus to all production",
      baseCost: 1,
      costMult: 2.5,
      max: 10,
      effect: "saltBonus",
      val: 0.3,
    },
    {
      id: "s_start1",
      name: "Scribe's Provisions",
      desc: "Begin each codex with denarii to hire an apprentice",
      baseCost: 2,
      costMult: 3.0,
      max: 5,
      effect: "startGold",
      val: 50,
    },
    {
      id: "s_pages1",
      name: "Prepared Vellum",
      desc: "+1 denarius per page across all codices",
      baseCost: 3,
      costMult: 2.8,
      max: 8,
      effect: "goldPerPage",
      val: 1,
    },
    {
      id: "s_auto1",
      name: "Eternal Scriptorium",
      desc: "Permanently doubles letters per second",
      baseCost: 5,
      costMult: 3.5,
      max: 5,
      effect: "autoMult",
      val: 2,
    },
    {
      id: "s_click1",
      name: "Golden Quill",
      desc: "Permanently doubles letters per keystroke",
      baseCost: 5,
      costMult: 3.5,
      max: 5,
      effect: "clickPermMult",
      val: 2,
    },
    {
      id: "s_capital",
      name: "Illuminated Capital",
      desc: "Adds the large capital letter to each folio page",
      baseCost: 2,
      costMult: 1,
      max: 1,
      effect: "capital",
      val: 1,
    },
    {
      id: "s_capital2",
      name: "Golden Capital",
      desc: "Adorns the capital with gold leaf and an ornate border",
      baseCost: 8,
      costMult: 1,
      max: 1,
      effect: "capital",
      val: 2,
    },
  ];

  return Object.freeze({
    PAGES_PER_CODEX,
    AUTO_TICK_MS,
    SCRIBE_TITLES,
    LOREM,
    FOLIO,
    FOLIO_LAYOUTS,
    GOLD_UPGRADES,
    SALT_UPGRADES,
  });
})();
