/**
 * nav.js — Navigation transitions
 * Adds a scan line sweep effect before page transitions.
 */

/**
 * Trigger a scan line sweep animation
 * @returns {Promise} Resolves when animation completes
 */
function triggerScanSweep() {
  return new Promise((resolve) => {
    const sweep = document.createElement('div');
    sweep.className = 'scan-sweep';
    document.body.appendChild(sweep);

    sweep.addEventListener('animationend', () => {
      sweep.remove();
      resolve();
    });

    // Fallback timeout in case animationend doesn't fire
    setTimeout(() => {
      sweep.remove();
      resolve();
    }, 400);
  });
}

/**
 * Initialize navigation transitions
 */
export function initNav() {
  // Intercept internal link clicks for scan sweep effect
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');

    // Only intercept internal links
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
      return;
    }

    // Don't intercept if modifier keys are held (open in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;

    e.preventDefault();

    // Run scan sweep then navigate
    await triggerScanSweep();
    window.location.href = href;
  });

  // Also intercept dispatch card clicks (which use onclick)
  document.querySelectorAll('.dispatch-card[onclick]').forEach(card => {
    const originalHref = card.getAttribute('onclick')
      .replace("window.location='", '')
      .replace("'", '');

    card.removeAttribute('onclick');

    card.addEventListener('click', async (e) => {
      if (e.target.closest('a')) return; // Let actual links handle themselves
      e.preventDefault();
      await triggerScanSweep();
      window.location.href = originalHref;
    });
  });
}
