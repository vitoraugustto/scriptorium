import Main from './main';
import Debug from './debug';

Debug.init();
Main.init(() => Debug.refreshLabels());
lucide.createIcons();
