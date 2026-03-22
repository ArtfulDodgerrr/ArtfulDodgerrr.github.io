/**
 * dispatch-loader.js — Reads manifest.json to enhance the dispatch list
 * The static HTML list is the primary content (works without JS).
 * This module adds dynamic features like record count updates.
 */

/**
 * Fetch the dispatch manifest
 * @returns {Promise<Object>} The manifest data
 */
async function fetchManifest() {
  try {
    const response = await fetch('/dispatches/manifest.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('[dispatch-loader] Could not load manifest:', err.message);
    return null;
  }
}

/**
 * Update the terminal block with live record count
 */
function updateRecordCount(count) {
  const lines = document.querySelectorAll('.terminal-block .line');
  lines.forEach(line => {
    if (line.textContent.includes('RECORDS FOUND')) {
      // Update count while preserving the cursor element
      const cursor = line.querySelector('.cursor');
      line.textContent = `${count} RECORDS FOUND`;
      line.classList.add('line--highlight');
      if (cursor) line.appendChild(cursor);
    }
  });
}

/**
 * Initialize the dispatch loader
 */
export async function initDispatchList() {
  const manifest = await fetchManifest();
  if (!manifest || !manifest.dispatches) return;

  // Update the record count in the terminal header
  updateRecordCount(manifest.dispatches.length);
}
