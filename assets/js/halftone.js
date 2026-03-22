/**
 * halftone.js — Animated canvas halftone dot background
 *
 * Three layered animations:
 * 1. BREATHE — slow sine-wave ripples propagate across the dot field,
 *    making dots swell and contract like the terminal is alive
 * 2. SCAN PULSE — a faint horizontal scan bar drifts downward on a loop,
 *    dots brighten and enlarge as it passes over them
 * 3. DRIFT — the entire noise field slowly evolves over time,
 *    so dot sizes organically shift (like signal interference)
 *
 * Runs at a capped frame rate (~20fps) to stay lightweight.
 */

// --- Noise utilities ---

function noise2D(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, y, scale) {
  const sx = x / scale;
  const sy = y / scale;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  const fx = sx - ix;
  const fy = sy - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = noise2D(ix, iy);
  const b = noise2D(ix + 1, iy);
  const c = noise2D(ix, iy + 1);
  const d = noise2D(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

// 3D noise slice — adds time dimension for drift
function smoothNoise3D(x, y, t, scale) {
  // Sample two 2D noise fields and interpolate with time
  const n1 = smoothNoise(x + t * 0.3, y + t * 0.2, scale);
  const n2 = smoothNoise(x - t * 0.2, y + t * 0.5, scale * 1.5);
  const blend = (Math.sin(t * 0.1) + 1) * 0.5;
  return n1 * (1 - blend * 0.4) + n2 * (blend * 0.4);
}

// --- Animation state ---

const STATE = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  dpr: 1,
  running: false,
  lastFrame: 0,
  time: 0,
  // Parsed dot color RGB
  dotR: 0,
  dotG: 113,
  dotB: 113,
  // Grid cache (pre-computed positions for performance)
  gridCols: 0,
  gridRows: 0,
};

// --- Configuration ---

const CONFIG = {
  gap: 14,             // Dot grid spacing
  minRadius: 0.4,      // Base minimum dot size
  maxRadius: 2.8,      // Base maximum dot size
  noiseScale: 80,      // Spatial noise frequency
  frameInterval: 50,   // ~20fps cap (ms between frames)

  // Breathe — radial sine waves
  breatheSpeed: 0.0006,     // How fast ripples propagate
  breatheWavelength: 300,   // Pixels between ripple peaks
  breatheIntensity: 0.35,   // How much dots swell (0-1)

  // Scan pulse — horizontal bar
  scanSpeed: 0.00004,       // How fast the scan bar moves (fraction of height/ms)
  scanWidth: 120,            // Pixel height of the glow zone
  scanIntensity: 0.5,       // Extra brightness/size in the scan zone
  scanPause: 4000,          // Ms pause between scan cycles

  // Drift — noise field evolution
  driftSpeed: 0.008,        // How fast the noise field shifts over time
};

/**
 * Size the canvas to the viewport
 */
function sizeCanvas() {
  STATE.dpr = window.devicePixelRatio || 1;
  STATE.width = window.innerWidth;
  STATE.height = window.innerHeight;
  STATE.canvas.width = STATE.width * STATE.dpr;
  STATE.canvas.height = STATE.height * STATE.dpr;
  STATE.canvas.style.width = STATE.width + 'px';
  STATE.canvas.style.height = STATE.height + 'px';
  STATE.ctx.setTransform(STATE.dpr, 0, 0, STATE.dpr, 0, 0);

  STATE.gridCols = Math.ceil(STATE.width / CONFIG.gap) + 1;
  STATE.gridRows = Math.ceil(STATE.height / CONFIG.gap) + 1;
}

/**
 * Compute the scan pulse position (0-1 fraction of screen height)
 * Returns -1 during pause phase
 */
function getScanPosition(time) {
  const cycleDuration = (1 / CONFIG.scanSpeed) + CONFIG.scanPause;
  const cycleTime = time % cycleDuration;
  const scanDuration = 1 / CONFIG.scanSpeed;

  if (cycleTime > scanDuration) return -1; // In pause phase
  return (cycleTime * CONFIG.scanSpeed);
}

/**
 * Draw one frame of the animated halftone field
 */
function drawFrame(timestamp) {
  if (!STATE.running) return;

  // Frame rate cap
  const delta = timestamp - STATE.lastFrame;
  if (delta < CONFIG.frameInterval) {
    requestAnimationFrame(drawFrame);
    return;
  }
  STATE.lastFrame = timestamp;
  STATE.time = timestamp;

  const { ctx, width, height } = STATE;
  const { gap, minRadius, maxRadius, noiseScale } = CONFIG;
  const { dotR, dotG, dotB } = STATE;

  ctx.clearRect(0, 0, width, height);

  // Time-based values
  const driftT = timestamp * CONFIG.driftSpeed;
  const breatheT = timestamp * CONFIG.breatheSpeed;
  const scanY = getScanPosition(timestamp);
  const scanWorldY = scanY * height;

  for (let col = 0; col < STATE.gridCols; col++) {
    const x = col * gap;

    for (let row = 0; row < STATE.gridRows; row++) {
      const y = row * gap;

      // --- Base noise (with drift) ---
      const n = smoothNoise3D(x, y, driftT, noiseScale);

      // --- Breathe ripple ---
      // Radial distance from center for concentric ripple
      const dx = x - width * 0.5;
      const dy = y - height * 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const breathe = Math.sin(dist / CONFIG.breatheWavelength * Math.PI * 2 - breatheT * 1000) * 0.5 + 0.5;
      const breatheBoost = breathe * CONFIG.breatheIntensity;

      // --- Scan pulse ---
      let scanBoost = 0;
      if (scanY >= 0) {
        const distFromScan = Math.abs(y - scanWorldY);
        if (distFromScan < CONFIG.scanWidth) {
          // Smooth falloff from scan center
          const scanFalloff = 1 - (distFromScan / CONFIG.scanWidth);
          scanBoost = scanFalloff * scanFalloff * CONFIG.scanIntensity;
        }
      }

      // --- Combine into final dot size ---
      const combinedNoise = Math.min(n + breatheBoost + scanBoost, 1);
      const radius = minRadius + (maxRadius - minRadius) * combinedNoise;

      // --- Edge fade ---
      const edgeFade = Math.min(
        x / (width * 0.15),
        (width - x) / (width * 0.15),
        y / (height * 0.15),
        (height - y) / (height * 0.15),
        1
      );

      // --- Alpha ---
      const baseAlpha = 0.12 + 0.35 * combinedNoise;
      const scanGlow = scanBoost * 0.6; // Extra brightness in scan zone
      const alpha = Math.min((baseAlpha + scanGlow) * edgeFade, 0.8);

      if (alpha < 0.01) continue; // Skip invisible dots

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotR}, ${dotG}, ${dotB}, ${alpha})`;
      ctx.fill();
    }
  }

  // --- Draw scan line glow ---
  if (scanY >= 0) {
    const gradient = ctx.createLinearGradient(0, scanWorldY - 2, 0, scanWorldY + 2);
    gradient.addColorStop(0, `rgba(${dotR}, ${dotG}, ${dotB}, 0)`);
    gradient.addColorStop(0.5, `rgba(${dotR}, ${dotG}, ${dotB}, 0.08)`);
    gradient.addColorStop(1, `rgba(${dotR}, ${dotG}, ${dotB}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, scanWorldY - 30, width, 60);
  }

  requestAnimationFrame(drawFrame);
}

/**
 * Parse the CSS custom property color to RGB
 */
function parseDotColor() {
  const dotColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--halftone-dot').trim() || '#007171';
  STATE.dotR = parseInt(dotColor.slice(1, 3), 16);
  STATE.dotG = parseInt(dotColor.slice(3, 5), 16);
  STATE.dotB = parseInt(dotColor.slice(5, 7), 16);
}

/**
 * Initialize the animated halftone canvas background
 */
export function initHalftone() {
  const bgElement = document.getElementById('halftone-bg');
  if (!bgElement) return;

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Fall back to static CSS pattern
    return;
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'halftone-canvas';
  bgElement.appendChild(canvas);
  bgElement.classList.add('has-canvas');

  STATE.canvas = canvas;
  STATE.ctx = canvas.getContext('2d');

  parseDotColor();
  sizeCanvas();

  // Start animation loop
  STATE.running = true;
  STATE.lastFrame = performance.now();
  requestAnimationFrame(drawFrame);

  // Handle resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      sizeCanvas();
    }, 200);
  });

  // Pause when tab is hidden (saves CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      STATE.running = false;
    } else {
      STATE.running = true;
      STATE.lastFrame = performance.now();
      requestAnimationFrame(drawFrame);
    }
  });
}
