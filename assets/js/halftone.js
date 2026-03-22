/**
 * halftone.js — Mouse-reactive glyph grid
 *
 * Grid uses alien/terminal-inspired shapes: eye glyphs, chevrons,
 * hex fragments, trigrams, hollow rings, rune marks, signal ticks.
 * Each cell's shape is deterministic from position noise.
 * Still by default, animates within mouse radius.
 */

// --- Noise ---

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

// --- Shape drawing functions (alien/terminal glyphs) ---

// Hollow ring
function drawRing(ctx, x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, s * 1.2, 0, Math.PI * 2);
  ctx.stroke();
}

// Eye glyph — almond shape with dot center
function drawEye(ctx, x, y, s) {
  const w = s * 2.2;
  const h = s * 1.2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.quadraticCurveTo(x, y - h, x + w / 2, y);
  ctx.quadraticCurveTo(x, y + h, x - w / 2, y);
  ctx.fill();
  // Pupil (cut out — draw darker)
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, s * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Chevron (arrow/caret pointing up)
function drawChevron(ctx, x, y, s) {
  const w = s * 1.8;
  const h = s * 1.4;
  const t = Math.max(s * 0.35, 0.5);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h / 3);
  ctx.lineTo(x, y - h / 3);
  ctx.lineTo(x + w / 2, y + h / 3);
  ctx.lineWidth = t;
  ctx.stroke();
}

// Trigram — three horizontal lines (alien script element)
function drawTrigram(ctx, x, y, s) {
  const w = s * 2;
  const gap = s * 0.7;
  const t = Math.max(s * 0.35, 0.5);
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(x - w / 2, y + i * gap - t / 2, w, t);
  }
}

// Hex fragment — partial hexagon (3 sides)
function drawHexFragment(ctx, x, y, s) {
  const r = s * 1.3;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.lineWidth = Math.max(s * 0.3, 0.5);
  ctx.stroke();
}

// Signal tick — vertical line with horizontal notch
function drawSignalTick(ctx, x, y, s) {
  const h = s * 2.2;
  const w = s * 1.2;
  const t = Math.max(s * 0.35, 0.5);
  // Vertical
  ctx.fillRect(x - t / 2, y - h / 2, t, h);
  // Horizontal notch at random height
  const notchY = y - h * 0.15;
  ctx.fillRect(x - t / 2, notchY - t / 2, w, t);
}

// Rune mark — angular Z/S shape
function drawRune(ctx, x, y, s) {
  const w = s * 1.5;
  const h = s * 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineWidth = Math.max(s * 0.3, 0.5);
  ctx.stroke();
}

// Dot cluster — 2-3 small dots in a pattern
function drawDotCluster(ctx, x, y, s) {
  const r = s * 0.4;
  const spread = s * 0.9;
  ctx.beginPath();
  ctx.arc(x - spread, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + spread, y - spread * 0.5, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + spread * 0.3, y + spread * 0.8, r, 0, Math.PI * 2);
  ctx.fill();
}

// Diamond with center line
function drawGlyph(ctx, x, y, s) {
  const r = s * 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.6, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.6, y);
  ctx.closePath();
  ctx.lineWidth = Math.max(s * 0.3, 0.5);
  ctx.stroke();
  // Center horizontal line
  const t = Math.max(s * 0.25, 0.4);
  ctx.fillRect(x - r * 0.4, y - t / 2, r * 0.8, t);
}

// Small cross/plus
function drawCross(ctx, x, y, s) {
  const arm = s * 1.5;
  const t = Math.max(s * 0.4, 0.5);
  ctx.fillRect(x - arm / 2, y - t / 2, arm, t);
  ctx.fillRect(x - t / 2, y - arm / 2, t, arm);
}

// Simple dot (fallback, most common)
function drawDot(ctx, x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.fill();
}

const SHAPE_FUNCS = [
  drawDot,         // 0 — most common
  drawDot,         // 1 — weighted heavier
  drawRing,        // 2
  drawEye,         // 3
  drawChevron,     // 4
  drawTrigram,     // 5
  drawHexFragment, // 6
  drawSignalTick,  // 7
  drawRune,        // 8
  drawDotCluster,  // 9
  drawGlyph,       // 10
  drawCross,       // 11
  drawDot,         // 12 — weighted
];

function getShapeIndex(col, row) {
  const hash = Math.abs(Math.sin(col * 73.17 + row * 139.53) * 9973.1);
  return Math.floor(hash) % SHAPE_FUNCS.length;
}

// --- State ---

const STATE = {
  canvas: null, ctx: null,
  width: 0, height: 0, dpr: 1,
  running: false, lastFrame: 0,
  mouseX: -9999, mouseY: -9999,
  smoothX: -9999, smoothY: -9999,
  mouseActive: false,
  dotR: 107, dotG: 91, dotB: 78,
  gridCols: 0, gridRows: 0,
};

const CONFIG = {
  gap: 20,
  minSize: 0.4,
  maxSize: 2.8,
  baseAlpha: 0.06,
  noiseScale: 60,
  frameInterval: 50,

  mouseRadius: 250,
  mouseSmoothing: 0.12,
  mouseMaxBoost: 0.85,

  rippleSpeed: 0.003,
  rippleWavelength: 35,
  rippleIntensity: 0.2,

  scanSpeed: 0.000025,
  scanWidth: 100,
  scanIntensity: 0.2,
  scanPause: 10000,
};

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

function getScanPosition(time) {
  const cycleDuration = (1 / CONFIG.scanSpeed) + CONFIG.scanPause;
  const cycleTime = time % cycleDuration;
  const scanDuration = 1 / CONFIG.scanSpeed;
  if (cycleTime > scanDuration) return -1;
  return (cycleTime * CONFIG.scanSpeed);
}

function drawFrame(timestamp) {
  if (!STATE.running) return;

  const delta = timestamp - STATE.lastFrame;
  if (delta < CONFIG.frameInterval) {
    requestAnimationFrame(drawFrame);
    return;
  }
  STATE.lastFrame = timestamp;

  STATE.smoothX += (STATE.mouseX - STATE.smoothX) * CONFIG.mouseSmoothing;
  STATE.smoothY += (STATE.mouseY - STATE.smoothY) * CONFIG.mouseSmoothing;

  const { ctx, width, height, smoothX, smoothY } = STATE;
  const { gap, minSize, maxSize, noiseScale, mouseRadius } = CONFIG;
  const { dotR, dotG, dotB } = STATE;
  const mouseRadiusSq = mouseRadius * mouseRadius;

  ctx.clearRect(0, 0, width, height);

  const scanY = getScanPosition(timestamp);
  const scanWorldY = scanY * height;
  const rippleT = timestamp * CONFIG.rippleSpeed;

  for (let col = 0; col < STATE.gridCols; col++) {
    const x = col * gap;

    for (let row = 0; row < STATE.gridRows; row++) {
      const y = row * gap;

      const n = smoothNoise(x, y, noiseScale);

      const dx = x - smoothX;
      const dy = y - smoothY;
      const distSq = dx * dx + dy * dy;

      let mouseBoost = 0;
      let rippleBoost = 0;

      if (STATE.mouseActive && distSq < mouseRadiusSq) {
        const dist = Math.sqrt(distSq);
        const proximity = 1 - (dist / mouseRadius);
        const smoothP = proximity * proximity * (3 - 2 * proximity);
        mouseBoost = smoothP * CONFIG.mouseMaxBoost;

        const ripple = Math.sin(dist / CONFIG.rippleWavelength * Math.PI * 2 - rippleT * 1000) * 0.5 + 0.5;
        rippleBoost = ripple * CONFIG.rippleIntensity * smoothP;
      }

      let scanBoost = 0;
      if (scanY >= 0) {
        const distFromScan = Math.abs(y - scanWorldY);
        if (distFromScan < CONFIG.scanWidth) {
          const f = 1 - (distFromScan / CONFIG.scanWidth);
          scanBoost = f * f * CONFIG.scanIntensity;
        }
      }

      const totalBoost = mouseBoost + rippleBoost + scanBoost;
      const combined = Math.min(n * 0.3 + totalBoost, 1);
      const size = minSize + (maxSize - minSize) * combined;
      const alpha = CONFIG.baseAlpha + (0.5 * totalBoost) + (0.04 * n);

      if (alpha < 0.02 || size < 0.3) continue;

      const color = `rgba(${dotR}, ${dotG}, ${dotB}, ${Math.min(alpha, 0.8)})`;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      const shapeIdx = getShapeIndex(col, row);
      SHAPE_FUNCS[shapeIdx](ctx, x, y, size);
    }
  }

  // Scan line glow
  if (scanY >= 0) {
    const gradient = ctx.createLinearGradient(0, scanWorldY - 2, 0, scanWorldY + 2);
    gradient.addColorStop(0, `rgba(${dotR}, ${dotG}, ${dotB}, 0)`);
    gradient.addColorStop(0.5, `rgba(${dotR}, ${dotG}, ${dotB}, 0.05)`);
    gradient.addColorStop(1, `rgba(${dotR}, ${dotG}, ${dotB}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, scanWorldY - 20, width, 40);
  }

  requestAnimationFrame(drawFrame);
}

function parseDotColor() {
  const dotColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--halftone-dot').trim() || '#6b5b4e';
  STATE.dotR = parseInt(dotColor.slice(1, 3), 16);
  STATE.dotG = parseInt(dotColor.slice(3, 5), 16);
  STATE.dotB = parseInt(dotColor.slice(5, 7), 16);
}

export function initHalftone() {
  const bgElement = document.getElementById('halftone-bg');
  if (!bgElement) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'halftone-canvas';
  bgElement.appendChild(canvas);
  bgElement.classList.add('has-canvas');

  STATE.canvas = canvas;
  STATE.ctx = canvas.getContext('2d');

  parseDotColor();
  sizeCanvas();

  document.addEventListener('mousemove', (e) => {
    STATE.mouseX = e.clientX;
    STATE.mouseY = e.clientY;
    STATE.mouseActive = true;
  });
  document.addEventListener('mouseleave', () => { STATE.mouseActive = false; });
  document.addEventListener('mouseenter', () => { STATE.mouseActive = true; });

  STATE.running = true;
  STATE.lastFrame = performance.now();
  requestAnimationFrame(drawFrame);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(sizeCanvas, 200);
  });

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
