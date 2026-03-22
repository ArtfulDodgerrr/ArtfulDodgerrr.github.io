/**
 * effects.js — Galaga-style pixel explosion effects
 *
 * All animations inspired by retro arcade death animations:
 * - Square pixel particles (not round)
 * - Multi-frame flicker (flash between colors before fading)
 * - Expanding ring pattern on nav clicks
 * - Pixel debris that tumbles
 */

const MAX_PARTICLES = 50;
let activeParticles = 0;

// Galaga-style color cycle: flashes through these before fading
const FLASH_COLORS = ['#8a7565', '#c4956a', '#ffffff', '#6b5b4e', '#4a3a2e'];

/**
 * Galaga-style pixel explosion — square particles that flash and scatter
 */
function spawnPixelExplosion(x, y, intensity) {
  const count = Math.floor(4 + intensity * 6); // 4-10 particles
  for (let i = 0; i < count; i++) {
    if (activeParticles >= MAX_PARTICLES) break;
    spawnPixelDebris(x, y, intensity);
  }
}

/**
 * Single pixel debris particle — square, flashes colors, tumbles
 */
function spawnPixelDebris(x, y, intensity) {
  activeParticles++;
  const particle = document.createElement('div');
  particle.className = 'click-particle';
  document.body.appendChild(particle);

  const angle = Math.random() * Math.PI * 2;
  const speed = 15 + Math.random() * 40 * intensity;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  // Square pixels: 1-3px
  const size = 1 + Math.random() * 2;
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';
  particle.style.borderRadius = '0'; // Square!

  const duration = 200 + Math.random() * 300;
  const start = performance.now();
  const flashSpeed = 40 + Math.random() * 30; // ms per color frame

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - (1 - progress) * (1 - progress);

    // Position
    particle.style.left = (x + vx * ease) + 'px';
    particle.style.top = (y + vy * ease + 8 * ease * ease) + 'px'; // slight gravity

    // Galaga flash: cycle through colors rapidly in first half, then fade
    if (progress < 0.5) {
      const colorIdx = Math.floor(elapsed / flashSpeed) % FLASH_COLORS.length;
      particle.style.background = FLASH_COLORS[colorIdx];
      particle.style.opacity = 1;
    } else {
      particle.style.background = FLASH_COLORS[FLASH_COLORS.length - 1];
      particle.style.opacity = 1 - ((progress - 0.5) * 2);
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      particle.remove();
      activeParticles--;
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Galaga ring burst — expands outward like an arcade explosion ring
 * Used on nav/interactive element clicks
 */
function spawnRingBurst(x, y) {
  // Spawn particles in a ring pattern (8 directions like Galaga)
  const directions = 8;
  for (let i = 0; i < directions; i++) {
    if (activeParticles >= MAX_PARTICLES) break;

    activeParticles++;
    const angle = (i / directions) * Math.PI * 2;
    const particle = document.createElement('div');
    particle.className = 'click-particle';
    document.body.appendChild(particle);

    const speed = 50 + Math.random() * 20;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    particle.style.width = '2px';
    particle.style.height = '2px';
    particle.style.borderRadius = '0';

    const duration = 350;
    const start = performance.now();

    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Step-wise movement (pixel snapping for retro feel)
      const step = Math.floor(progress * 6) / 6;
      particle.style.left = (x + vx * step) + 'px';
      particle.style.top = (y + vy * step) + 'px';

      // Flash
      const colorIdx = Math.floor(elapsed / 50) % FLASH_COLORS.length;
      particle.style.background = FLASH_COLORS[colorIdx];
      particle.style.opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
        activeParticles--;
      }
    }

    // Stagger slightly for wave effect
    setTimeout(() => requestAnimationFrame(animate), i * 15);
  }
}

/**
 * Spawn ASCII debris — terminal characters scatter with pixel feel
 */
function spawnAsciiDebris(x, y) {
  const chars = ['-', '|', '\\', '/', '+', '*', '·', '█', '▓', '░'];
  const count = 4 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    if (activeParticles >= MAX_PARTICLES) break;

    activeParticles++;
    const particle = document.createElement('span');
    particle.className = 'ascii-particle';
    particle.textContent = chars[Math.floor(Math.random() * chars.length)];
    document.body.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 40;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const duration = 300 + Math.random() * 150;
    const start = performance.now();

    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Stepped movement for pixel feel
      const step = Math.floor(progress * 5) / 5;
      particle.style.left = (x + vx * step) + 'px';
      particle.style.top = (y + vy * step + 5 * step * step) + 'px';

      // Flash then fade
      if (progress < 0.4) {
        const colorIdx = Math.floor(elapsed / 60) % FLASH_COLORS.length;
        particle.style.color = FLASH_COLORS[colorIdx];
        particle.style.opacity = 1;
      } else {
        particle.style.opacity = 1 - ((progress - 0.4) / 0.6);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
        activeParticles--;
      }
    }

    setTimeout(() => requestAnimationFrame(animate), i * 30);
  }
}

/**
 * Fizz dots — square pixel fizz on dispatch card hover
 */
function spawnFizzPixels(element) {
  const rect = element.getBoundingClientRect();
  const count = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    if (activeParticles >= MAX_PARTICLES) break;

    activeParticles++;
    const dot = document.createElement('div');
    dot.className = 'fizz-dot';
    dot.style.borderRadius = '0'; // Square
    element.appendChild(dot);

    const startY = Math.random() * rect.height;
    dot.style.left = '-4px';
    dot.style.top = startY + 'px';

    const size = 1 + Math.random() * 2;
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';

    const duration = 200 + Math.random() * 150;
    const start = performance.now();
    const driftX = -3 - Math.random() * 8;
    const driftY = -10 - Math.random() * 15;

    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Stepped for pixel feel
      const step = Math.floor(progress * 4) / 4;
      dot.style.transform = `translate(${driftX * step}px, ${driftY * step}px)`;
      dot.style.opacity = 1 - progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        dot.remove();
        activeParticles--;
      }
    }

    setTimeout(() => requestAnimationFrame(animate), i * 40);
  }
}

function isNavElement(el) {
  return el.closest('.site-nav a') ||
         el.closest('.back-link') ||
         el.closest('.dispatch-nav a') ||
         el.closest('.dispatch-card') ||
         el.closest('.site-logo a');
}

export function initEffects() {
  document.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    if (isNavElement(e.target)) {
      // Nav clicks: ring burst + ASCII debris (Galaga death)
      spawnRingBurst(x, y);
      spawnAsciiDebris(x, y);
    } else {
      // General clicks: pixel explosion
      spawnPixelExplosion(x, y, 0.6);
    }
  });

  const cards = document.querySelectorAll('.dispatch-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      spawnFizzPixels(card);
    });
  });
}
