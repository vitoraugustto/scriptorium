import type { GoldUpgrade, SaltUpgrade } from '../types';

const GOLD_UPGRADES: GoldUpgrade[] = [
  {
    id: 'g_quill',
    name: 'Goose Quill',
    desc: 'A well-cut quill from the wing of a grey goose, the scribe\'s most faithful instrument',
    baseCost: 5,
    costMult: 2.3,
    max: 10,
    effect: 'clickAdd',
    val: 1,
  },
  {
    id: 'g_ruling',
    name: 'Parchment Ruling',
    desc: 'Lines ruled into the vellum leave traces of red ink. Each red word earns 1 extra denarius when the page turns.',
    baseCost: 10,
    costMult: 2.0,
    max: 10,
    effect: 'pageAdd',
    val: 1,
  },
];

const SALT_UPGRADES: SaltUpgrade[] = [
  {
    id: 's_benefice',
    name: 'Benefice',
    desc: 'A permanent grant from the scriptorium. Each level raises all production by 10%.',
    baseCost: 1,
    costMult: 2.5,
    max: 10,
    effect: 'saltBonus',
    val: 0.1,
  },
];

export { GOLD_UPGRADES, SALT_UPGRADES };
