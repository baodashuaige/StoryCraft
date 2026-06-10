/**
 * Ambient particle effects for Frostmere House.
 *
 * A full-viewport canvas overlay combining:
 * - Snow particles (white, falling)
 * - Dust motes (warm gold, drifting upward)
 * - Ground fog gradient
 *
 * All drawn on a single canvas layer for performance.
 */

interface Particle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  wind: number;
  wobble: number;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let rafId = 0;
let flakes: Particle[] = [];
let motes: Particle[] = [];
let running = false;
let _w = 0;
let _h = 0;

const MAX_FLAKES = 100;
const MAX_MOTES = 50;

/* ── Resize ─────────────────────────────────────────────── */
function resize() {
  if (!canvas) return;
  _w = window.innerWidth;
  _h = window.innerHeight;
  canvas.width = _w;
  canvas.height = _h;
}

/* ── Snowflake factory ──────────────────────────────────── */
function makeFlake(): Particle {
  const depth = Math.random();
  return {
    x: Math.random() * _w,
    y: Math.random() * -_h,
    radius: 0.5 + depth * 1.6,
    opacity: 0.05 + depth * 0.15,
    speed: 0.3 + depth * 1.1,
    wind: -0.3 + Math.random() * 0.6,
    wobble: Math.random() * Math.PI * 2,
  };
}

/* ── Dust mote factory ──────────────────────────────────── */
function makeMote(): Particle {
  return {
    x: Math.random() * _w,
    y: Math.random() * _h,
    radius: 0.3 + Math.random() * 0.9,
    opacity: 0.02 + Math.random() * 0.05,
    speed: -(0.02 + Math.random() * 0.08), // negative = drifts upward
    wind: -0.15 + Math.random() * 0.3,
    wobble: Math.random() * Math.PI * 2,
  };
}

/* ── Fill pools ─────────────────────────────────────────── */
function refill() {
  while (flakes.length < MAX_FLAKES) flakes.push(makeFlake());
  while (motes.length < MAX_MOTES) motes.push(makeMote());
}

/* ── Tick ───────────────────────────────────────────────── */
let frame = 0;
function tick() {
  if (!running || !ctx) return;
  frame++;

  ctx.clearRect(0, 0, _w, _h);

  // Ground fog
  const fogH = _h * 0.35;
  const fogGrad = ctx.createLinearGradient(0, _h - fogH, 0, _h);
  fogGrad.addColorStop(0, "rgba(200,210,225,0)");
  fogGrad.addColorStop(0.5, "rgba(200,210,225,0.03)");
  fogGrad.addColorStop(1, "rgba(200,210,225,0.08)");
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, _h - fogH, _w, fogH);

  // Wind gust (affects snow only)
  const gust = Math.sin(frame * 0.003) * 0.35;

  // ── Snowflakes ────────────────────────────────────────
  for (const f of flakes) {
    f.y += f.speed;
    f.x += f.wind + gust + Math.sin(frame * 0.02 + f.wobble) * 0.12;

    if (f.y > _h + 10) { f.y = -10; f.x = Math.random() * _w; }
    if (f.x > _w + 10) f.x = -10;
    if (f.x < -10) f.x = _w + 10;

    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(230,235,245,${f.opacity.toFixed(3)})`;
    ctx.fill();
  }

  // ── Dust motes ─────────────────────────────────────────
  for (const m of motes) {
    m.y += m.speed;
    m.x += m.wind + Math.sin(frame * 0.015 + m.wobble) * 0.08;

    if (m.y < -10) { m.y = _h + 10; m.x = Math.random() * _w; }
    if (m.x > _w + 10) m.x = -10;
    if (m.x < -10) m.x = _w + 10;

    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(210,180,110,${m.opacity.toFixed(3)})`;
    ctx.fill();
  }

  refill();
  rafId = requestAnimationFrame(tick);
}

/* ── Public API ─────────────────────────────────────────── */
export function startSnow(): void {
  if (running) return;

  canvas = document.createElement("canvas");
  canvas.id = "ambient-canvas";
  canvas.style.cssText =
    "position:fixed;inset:0;z-index:9999;pointer-events:none;";
  document.body.prepend(canvas);
  ctx = canvas.getContext("2d")!;

  resize();
  window.addEventListener("resize", resize);

  flakes = []; motes = [];
  refill();

  running = true;
  tick();
}

export function stopSnow(): void {
  running = false;
  cancelAnimationFrame(rafId);
  window.removeEventListener("resize", resize);

  if (canvas) { canvas.remove(); canvas = null; ctx = null; }
  flakes = []; motes = [];
}
