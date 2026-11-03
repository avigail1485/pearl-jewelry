import './styles/index.css';
import './styles/layout.css';
import './styles/home.css';
import { mountGridOverlay } from './ui/grid-overlay';
import { markMissingAssets } from './core/assets';
import { initSmoothScroll } from './scroll/smooth';
import { initHero } from './chapters/hero';
import { initStatements } from './chapters/statement';
import { mountMarquees } from './ui/marquee';

mountGridOverlay();
markMissingAssets();

if (document.querySelector('.hero')) {
  initSmoothScroll();
  initHero();
  mountMarquees();
  initStatements();
}
