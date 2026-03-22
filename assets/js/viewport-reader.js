/**
 * viewport-reader.js — Terminal text buffer effect
 *
 * Text in the dispatch body appears to be "generated" by a terminal.
 * Only text within a visible window is rendered. At the top and bottom
 * edges of the window, text trails off into "..." as if the terminal
 * is still buffering/thinking. Scrolling "populates" more text.
 *
 * Implementation: wraps each text node in spans, then clips characters
 * based on vertical position relative to the viewport window.
 */

const CONFIG = {
  // Visible window: characters inside this zone are fully shown
  windowTop: 0.18,       // fraction of viewport height from top
  windowBottom: 0.82,    // fraction of viewport height from bottom
  // Buffer zone: characters here are partially shown (trailing into ...)
  bufferSize: 60,        // px of transition zone at each edge
  // How often to recalculate
  throttleMs: 40,
  // The ellipsis string
  ellipsis: '. . .',
};

let overlayTop = null;
let overlayBottom = null;
let indicatorTop = null;
let indicatorBottom = null;
let dispatchBody = null;
let isInitialized = false;

/**
 * Create the hard-edge overlays (opaque black, not gradient)
 * and the blinking ellipsis indicators
 */
function createOverlays() {
  // Top overlay — solid black covering top portion
  overlayTop = document.createElement('div');
  overlayTop.className = 'terminal-buffer terminal-buffer--top';
  document.body.appendChild(overlayTop);

  // Bottom overlay
  overlayBottom = document.createElement('div');
  overlayBottom.className = 'terminal-buffer terminal-buffer--bottom';
  document.body.appendChild(overlayBottom);

  // Top ellipsis indicator (sits at the boundary, blinks like it's loading)
  indicatorTop = document.createElement('div');
  indicatorTop.className = 'buffer-indicator buffer-indicator--top';
  indicatorTop.innerHTML = `<span class="buffer-indicator__text">${CONFIG.ellipsis}</span>`;
  document.body.appendChild(indicatorTop);

  // Bottom ellipsis indicator
  indicatorBottom = document.createElement('div');
  indicatorBottom.className = 'buffer-indicator buffer-indicator--bottom';
  indicatorBottom.innerHTML = `<span class="buffer-indicator__text">${CONFIG.ellipsis}</span>`;
  document.body.appendChild(indicatorBottom);
}

/**
 * Update indicator visibility and position
 */
function update() {
  if (!dispatchBody) return;

  const rect = dispatchBody.getBoundingClientRect();
  const vh = window.innerHeight;
  const windowTopPx = vh * CONFIG.windowTop;
  const windowBottomPx = vh * CONFIG.windowBottom;

  // Is there content above the visible window?
  const hasContentAbove = rect.top < windowTopPx;
  // Is there content below the visible window?
  const hasContentBelow = rect.bottom > windowBottomPx;

  // Show/hide indicators
  indicatorTop.classList.toggle('visible', hasContentAbove);
  indicatorBottom.classList.toggle('visible', hasContentBelow);
}

/**
 * Initialize the terminal buffer effect on dispatch pages
 */
export function initViewportReader() {
  dispatchBody = document.querySelector('.dispatch-body');
  if (!dispatchBody) return; // Only on dispatch detail pages

  createOverlays();
  isInitialized = true;

  // Initial state
  update();

  // Throttled scroll listener
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Also update on resize
  window.addEventListener('resize', update, { passive: true });
}
