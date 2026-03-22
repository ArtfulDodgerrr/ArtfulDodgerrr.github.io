/**
 * effects.js — Interactive particle and dot effects
 * All effects are event-driven. No background animation loops.
 */

// Maximum concurrent particles to prevent DOM bloat
const MAX_PARTICLES = 30;
let activeParticles = 0;

/**
 * Spawn a click particle burst at the given coordinates
 */
function spawnClickBurst(x, y) {
  const count = 8 + Math.floor(Math.random() * 5); // 8-12 particles

  for (let i = 0; i < count; i++) {
    if (activeParticles >= MAX_PARTICLES) break;
    spawnParticle(x, y);
  }
}

/**
 * Create a single particle element with random velocity
 */
function spawnParticle(x, y) {
  activeParticles++;

  const particle = document.createElement('div');
  particle.className = 'click-particle';
  document.body.appendChild(particle);

  // Random velocity
  const angle = Math.random() * Math.PI * 2;
  const speed = 40 + Math.random() * 80;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  // Random size variation
  const size = 2 + Math.random() * 4;
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';

  // Animate
  const duration = 300 + Math.random() * 200;
  const start = performance.now();

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out
    const ease = 1 - (1 - progress) * (1 - progress);

    const px = x + vx * ease;
    const py = y + vy * ease - (20 * ease); // slight upward drift

    particle.style.left = px + 'px';
    particle.style.top = py + 'px';
    particle.style.opacity = 1 - progress;
    particle.style.transform = `scale(${1 - progress * 0.5})`;

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
 * Spawn fizz dots along the left border of an element (for dispatch cards)
 */
function spawnFizzDots(element) {
  const rect = element.getBoundingClientRect();
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 dots

  for (let i = 0; i < count; i++) {
    if (activeParticles >= MAX_PARTICLES) break;

    activeParticles++;
    const dot = document.createElement('div');
    dot.className = 'fizz-dot';
    element.appendChild(dot);

    // Position along left border
    const startY = Math.random() * rect.height;
    dot.style.left = '-4px';
    dot.style.top = startY + 'px';

    // Size variation
    const size = 1 + Math.random() * 3;
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';

    // Float upward and fade
    const duration = 250 + Math.random() * 200;
    const start = performance.now();
    const driftX = -5 - Math.random() * 10;
    const driftY = -15 - Math.random() * 20;

    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      dot.style.transform = `translate(${driftX * progress}px, ${driftY * progress}px)`;
      dot.style.opacity = 1 - progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        dot.remove();
        activeParticles--;
      }
    }

    // Stagger start
    setTimeout(() => requestAnimationFrame(animate), i * 50);
  }
}

/**
 * Initialize all interactive effects
 */
export function initEffects() {
  // Click particle burst — on any click
  document.addEventListener('click', (e) => {
    spawnClickBurst(e.clientX, e.clientY);
  });

  // Hover fizz dots — on dispatch cards
  const cards = document.querySelectorAll('.dispatch-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      spawnFizzDots(card);
    });
  });
}
