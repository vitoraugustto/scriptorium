import { createIcons, Coins, Gem, Bug, Layout, RotateCcw, PencilLine, Save } from 'lucide';
import Main from './main';
import Debug from './debug';

const icons = { Coins, Gem, Bug, Layout, RotateCcw, PencilLine, Save };

Debug.init(createIcons, icons);
// icons render from data-lucide attributes written during the first refresh,
// so they must be created after init resolves
void Main.init(() => Debug.refreshLabels()).then(() => createIcons({ icons }));
