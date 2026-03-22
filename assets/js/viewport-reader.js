/**
 * viewport-reader.js — Terminal text generation effect
 *
 * Text in the dispatch body appears to be "generated" by a terminal.
 * Words near the top and bottom edges of the viewport are replaced
 * with randomized terminal characters — garbled noise that looks like
 * the terminal is still loading/generating the text. As the user
 * scrolls, garbled words resolve into real text, and text scrolling
 * out of view degrades back into noise.
 *
 * Implementation: wraps each word in a <span>, stores the original
 * text, and on scroll replaces characters based on distance from
 * the viewport's readable zone boundaries.
 */

const CONFIG = {
  // Readable zone: fraction of viewport height
  // Words fully inside this zone show their real text
  readableTop: 0.12,
  readableBottom: 0.88,

  // Buffer zone size in px — words in this zone transition
  // from garbled → readable (or vice versa)
  bufferSize: 80,

  // Characters used for garbled text (terminal/alien feel)
  // Only single-width monospace-safe chars — no full-width box-drawing
  glitchChars: '|/-\\:;{}[]<>!@#$%&*=+~?.^_`\'',

  // How often garbled characters re-randomize (for flickering effect)
  flickerInterval: 120,
};

// Terminal noise characters for the "unloaded" state
const NOISE = CONFIG.glitchChars;

let dispatchBody = null;
let wordSpans = [];      // All wrapped word spans
let flickerTimer = null;
let lastScrollY = -1;

/**
 * Wrap all text nodes inside dispatch-body in word-level spans.
 * Preserves existing HTML elements (images, figures, etc).
 */
function wrapWords() {
  const walker = document.createTreeWalker(
    dispatchBody,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip empty/whitespace-only nodes
        if (!node.textContent.trim()) return NodeFilter.FILTER_SKIP;
        // Skip nodes inside figures/figcaptions (don't garble captions)
        if (node.parentElement.closest('figure, figcaption')) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(textNode => {
    const parent = textNode.parentNode;
    const text = textNode.textContent;

    // Split on word boundaries, keeping whitespace
    const parts = text.split(/(\s+)/);
    const frag = document.createDocumentFragment();

    parts.forEach(part => {
      if (/^\s+$/.test(part)) {
        // Whitespace — keep as plain text node
        frag.appendChild(document.createTextNode(part));
      } else if (part.length > 0) {
        const span = document.createElement('span');
        span.className = 'vr-word';
        span.dataset.original = part;
        span.textContent = part;
        span.dataset.state = 'normal'; // 'normal', 'garbled', 'noise'
        frag.appendChild(span);
        wordSpans.push(span);
      }
    });

    parent.replaceChild(frag, textNode);
  });
}

/**
 * Generate garbled text of the same length as the original word.
 * Mix of original chars and noise based on how deep into the buffer zone.
 * @param {string} original - The real word
 * @param {number} factor - 0 = fully readable, 1 = fully garbled
 */
function garbleWord(original, factor) {
  if (factor <= 0) return original;
  if (factor >= 1) {
    // Fully garbled — all noise characters
    let result = '';
    for (let i = 0; i < original.length; i++) {
      result += NOISE[Math.floor(Math.random() * NOISE.length)];
    }
    return result;
  }

  // Partial garble — replace some characters based on factor
  let result = '';
  for (let i = 0; i < original.length; i++) {
    if (Math.random() < factor) {
      result += NOISE[Math.floor(Math.random() * NOISE.length)];
    } else {
      result += original[i];
    }
  }
  return result;
}

/**
 * Calculate garble factor for a word based on its vertical position.
 * Returns 0 (fully readable) to 1 (fully garbled).
 */
function getGarbleFactor(wordRect, vh, topBound, bottomBound) {
  const wordCenter = wordRect.top + wordRect.height / 2;

  // Above the readable zone
  if (wordCenter < topBound) {
    const dist = topBound - wordCenter;
    return Math.min(dist / CONFIG.bufferSize, 1);
  }

  // Below the readable zone
  if (wordCenter > bottomBound) {
    const dist = wordCenter - bottomBound;
    return Math.min(dist / CONFIG.bufferSize, 1);
  }

  // Inside the readable zone
  return 0;
}

/**
 * Main update: check each word's position and garble/ungarble as needed.
 */
function update() {
  const vh = window.innerHeight;
  const topBound = vh * CONFIG.readableTop;
  const bottomBound = vh * CONFIG.readableBottom;

  // Only process words that are roughly on screen (± buffer)
  // This avoids expensive getBoundingClientRect on off-screen elements
  const screenTop = -CONFIG.bufferSize * 2;
  const screenBottom = vh + CONFIG.bufferSize * 2;

  for (let i = 0; i < wordSpans.length; i++) {
    const span = wordSpans[i];
    const rect = span.getBoundingClientRect();

    // Skip words clearly off-screen
    if (rect.bottom < screenTop || rect.top > screenBottom) {
      // If it was normal, make it garbled (it's off screen)
      if (span.dataset.state !== 'noise') {
        span.textContent = garbleWord(span.dataset.original, 1);
        span.dataset.state = 'noise';
        span.classList.add('vr-garbled');
      }
      continue;
    }

    const factor = getGarbleFactor(rect, vh, topBound, bottomBound);

    if (factor <= 0) {
      // Fully readable
      if (span.dataset.state !== 'normal') {
        span.textContent = span.dataset.original;
        span.dataset.state = 'normal';
        span.classList.remove('vr-garbled');
      }
    } else {
      // Garbled (partially or fully)
      span.textContent = garbleWord(span.dataset.original, factor);
      span.dataset.state = factor >= 1 ? 'noise' : 'garbled';
      span.classList.add('vr-garbled');
    }
  }
}

/**
 * Re-randomize only the currently garbled words (flicker effect).
 * Makes the noise feel alive, like the terminal is processing.
 */
function flicker() {
  const vh = window.innerHeight;
  const screenTop = -CONFIG.bufferSize * 2;
  const screenBottom = vh + CONFIG.bufferSize * 2;
  const topBound = vh * CONFIG.readableTop;
  const bottomBound = vh * CONFIG.readableBottom;

  for (let i = 0; i < wordSpans.length; i++) {
    const span = wordSpans[i];
    if (span.dataset.state === 'normal') continue;

    const rect = span.getBoundingClientRect();
    if (rect.bottom < screenTop || rect.top > screenBottom) continue;

    const factor = getGarbleFactor(rect, vh, topBound, bottomBound);
    if (factor > 0) {
      span.textContent = garbleWord(span.dataset.original, factor);
    }
  }
}

/**
 * Initialize the terminal text generation effect on dispatch pages
 */
export function initViewportReader() {
  dispatchBody = document.querySelector('.dispatch-body');
  if (!dispatchBody) return; // Only on dispatch detail pages
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Wrap all text in word spans
  wrapWords();

  // Initial garble state
  update();

  // Scroll listener (throttled via rAF)
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

  // Flicker timer — re-randomize garbled words periodically
  flickerTimer = setInterval(flicker, CONFIG.flickerInterval);

  // Pause flicker when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(flickerTimer);
    } else {
      flickerTimer = setInterval(flicker, CONFIG.flickerInterval);
      update();
    }
  });

  // Update on resize
  window.addEventListener('resize', update, { passive: true });
}
