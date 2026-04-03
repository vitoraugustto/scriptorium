import { createIcons, Coins, Gem, Bug, Layout, RotateCcw, PencilLine } from 'lucide';
import Main from './main';
import Debug from './debug';

const icons = { Coins, Gem, Bug, Layout, RotateCcw, PencilLine };

Debug.init(createIcons, icons);
Main.init(() => Debug.refreshLabels());
createIcons({ icons });
