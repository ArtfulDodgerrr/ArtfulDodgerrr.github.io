/**
 * main.js — Entry point
 * Imports and initializes all modules.
 * Uses native ES modules (no bundler needed).
 */

import { initHalftone } from './halftone.js';
import { initEffects } from './effects.js';
import { initNav } from './nav.js';
import { initDispatchList } from './dispatch-loader.js';
import { initViewportReader } from './viewport-reader.js';

document.addEventListener('DOMContentLoaded', () => {
  // Core visual layers
  initHalftone();
  initEffects();
  initNav();

  // Viewport reading effect (dispatch detail pages only)
  initViewportReader();

  // Dispatch list enhancement (only runs on index page)
  if (document.querySelector('[data-dispatch-list]')) {
    initDispatchList();
  }
});
