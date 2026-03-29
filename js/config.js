'use strict';

const Config = (() => {
  const LETTERS_PER_PAGE = 1200;
  const PAGES_PER_CODEX  = 300;
  const AUTO_TICK_MS     = 50;

  const SCRIBE_TITLES = [
    'Novice Scribe','Skilled Copyist','Master Calligrapher',
    'Keeper of the Scriptorium','Royal Illuminator','Eternal Archivist',
  ];

  const LOREM = [
    'veritas','lumen','anima','gloria','pax','virtus','sapientia',
    'fides','gratia','caritas','honor','lex','cor','vita','mors',
    'terra','caelum','aqua','ignis','spiritus','tempus','memoria',
    'liber','scriptura','pagina','codex','calamus','atramento',
    'monasterium','claustrum','oratio','cantus','silentium','labor',
    'sanctus','beatus','deus','dominus','rex','regina','miles',
  ];

  // Folio geometry (SVG viewBox 210×300)
  const FOLIO = {
    xStart:  26,   // after margin line, or 58 for lines beside capital
    xEnd:    194,
    yFirst:  30,   // first baseline
    yStep:   10,   // line spacing
    fontSize: 5.8,
    charW:   3.3,
    totalLines: 26,
    get lineW()        { return this.xEnd - this.xStart; },
    get charsPerLine() { return Math.floor(this.lineW / this.charW); },
    get charsPerLineNarrow() { return Math.floor((this.xEnd - 58) / this.charW); },
  };

  const GOLD_UPGRADES = [
    { id:'g_click1', name:'Goose Quill',
      desc:'A sharper quill — each keystroke writes more letters',
      baseCost:5,      costMult:1.5, max:10, effect:'clickMult', val:2 },
    { id:'g_auto1',  name:'Apprentice',
      desc:'A young helper copies while you rest by the fire',
      baseCost:12,     costMult:1.6, max:20, effect:'autoAdd',   val:1 },
    { id:'g_click2', name:'Iron Gall Ink',
      desc:'Denser ink — cleaner strokes, higher output',
      baseCost:40,     costMult:1.8, max:8,  effect:'clickMult', val:2 },
    { id:'g_auto2',  name:'Copyist',
      desc:'Seasoned scribe with constant, steady production',
      baseCost:80,     costMult:1.7, max:15, effect:'autoAdd',   val:5 },
    { id:'g_click3', name:'Refined Calligraphy',
      desc:'Years of practice — every stroke worth three times more',
      baseCost:200,    costMult:2.0, max:5,  effect:'clickMult', val:3 },
    { id:'g_auto3',  name:'Benedictine Monk',
      desc:'Devoted to copying. Tireless, silent, precise',
      baseCost:500,    costMult:1.8, max:10, effect:'autoAdd',   val:25 },
    { id:'g_click4', name:'Treated Vellum',
      desc:'Noble material — each page written yields more',
      baseCost:2000,   costMult:2.2, max:5,  effect:'clickMult', val:3 },
    { id:'g_auto4',  name:'Scriptorium Hall',
      desc:'A full room of copyists working in Gregorian harmony',
      baseCost:5000,   costMult:2.0, max:8,  effect:'autoAdd',   val:100 },
    { id:'g_click5', name:'Illumination',
      desc:'Pages adorned with rare pigments — letters multiplied',
      baseCost:20000,  costMult:2.5, max:3,  effect:'clickMult', val:5 },
    { id:'g_auto5',  name:'Royal Library',
      desc:'Production at scale for the crown, day and night',
      baseCost:80000,  costMult:2.2, max:5,  effect:'autoAdd',   val:500 },
    { id:'g_auto6',  name:'Order of Scribes',
      desc:'A brotherhood devoted to the preservation of knowledge',
      baseCost:400000, costMult:2.3, max:3,  effect:'autoAdd',   val:2000 },
  ];

  const SALT_UPGRADES = [
    { id:'s_bonus1',   name:'Salt Cellar',
      desc:'Permanent +30% bonus to all production',
      baseCost:1, costMult:2.5, max:10, effect:'saltBonus',     val:0.3 },
    { id:'s_start1',   name:"Scribe's Provisions",
      desc:'Begin each codex with denarii to hire an apprentice',
      baseCost:2, costMult:3.0, max:5,  effect:'startGold',     val:50 },
    { id:'s_pages1',   name:'Prepared Vellum',
      desc:'+1 denarius per page across all codices',
      baseCost:3, costMult:2.8, max:8,  effect:'goldPerPage',   val:1 },
    { id:'s_auto1',    name:'Eternal Scriptorium',
      desc:'Permanently doubles letters per second',
      baseCost:5, costMult:3.5, max:5,  effect:'autoMult',      val:2 },
    { id:'s_click1',   name:'Golden Quill',
      desc:'Permanently doubles letters per keystroke',
      baseCost:5, costMult:3.5, max:5,  effect:'clickPermMult', val:2 },
    { id:'s_capital',  name:'Illuminated Capital',
      desc:'Adds the large capital letter to each folio page',
      baseCost:2, costMult:1,   max:1,  effect:'capital',       val:1 },
    { id:'s_capital2', name:'Golden Capital',
      desc:'Adorns the capital with gold leaf and an ornate border',
      baseCost:8, costMult:1,   max:1,  effect:'capital',       val:2 },
  ];

  return Object.freeze({
    LETTERS_PER_PAGE, PAGES_PER_CODEX, AUTO_TICK_MS,
    SCRIBE_TITLES, LOREM, FOLIO,
    GOLD_UPGRADES, SALT_UPGRADES,
  });
})();
