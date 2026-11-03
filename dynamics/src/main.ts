import './styles/index.css';
import './styles/layout.css';
import { mountGridOverlay } from './ui/grid-overlay';
import { markMissingAssets } from './core/assets';

mountGridOverlay();
markMissingAssets();
