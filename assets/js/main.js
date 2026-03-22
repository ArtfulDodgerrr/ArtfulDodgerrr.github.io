/**
 * main.js — Entry point
 * Imports and initializes all modules.
 * Uses native ES modules (no bundler needed).
 */

import { initHalftone } from './halftone.js';
import { initEffects } from './effects.js';
import { initNav } from './nav.js';
import { initDispatchList } from './dispatch-loader.js';

document.addEventListener('DOMContentLoaded', () => {
  // Core visual layers
  initHalftone();
  initEffects();
  initNav();

  // Dispatch list enhancement (only runs on index page)
  if (document.querySelector('[data-dispatch-list]')) {
    initDispatchList();
  }
});
