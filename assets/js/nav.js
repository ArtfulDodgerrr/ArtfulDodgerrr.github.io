/**
 * nav.js — Page transition with delay for click effects
 *
 * Transition: waits ~350ms (so Galaga click effects play out),
 * then does a stepped pixel wipe — rows appear in a cascade.
 * Slower and more deliberate than before.
 */

/**
 * Trigger a pixel wipe transition with pre-delay
 * @returns {Promise} Resolves when animation completes
 */
function triggerPixelWipe() {
  return new Promise((resolve) => {
    // Delay before starting wipe — lets click effects play
    setTimeout(() => {
      const overlay = document.createElement('div');
      overlay.className = 'pixel-wipe';
      document.body.appendChild(overlay);

      const rows = 10;
      const rowHeight = Math.ceil(window.innerHeight / rows);

      for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.className = 'pixel-wipe__row';
        row.style.top = (i * rowHeight) + 'px';
        row.style.height = (rowHeight + 1) + 'px';
        row.style.animationDelay = (i * 45) + 'ms'; // Slower cascade
        overlay.appendChild(row);
      }

      // Resolve after all rows have appeared
      const totalDuration = rows * 45 + 350;
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, totalDuration);
    }, 300); // Pre-delay: let click particles play
  });
}

/**
 * Initialize navigation transitions
 */
export function initNav() {
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');

    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
      return;
    }

    if (e.metaKey || e.ctrlKey || e.shiftKey) return;

    e.preventDefault();
    await triggerPixelWipe();
    window.location.href = href;
  });

  // Dispatch card clicks
  document.querySelectorAll('.dispatch-card[onclick]').forEach(card => {
    const originalHref = card.getAttribute('onclick')
      .replace("window.location='", '')
      .replace("'", '');

    card.removeAttribute('onclick');

    card.addEventListener('click', async (e) => {
      if (e.target.closest('a')) return;
      e.preventDefault();
      await triggerPixelWipe();
      window.location.href = originalHref;
    });
  });
}
