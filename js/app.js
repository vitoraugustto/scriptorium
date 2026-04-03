import Main from './main.js';
import Debug from './debug.js';

Debug.init();
Main.init(() => Debug.refreshLabels());
lucide.createIcons();
