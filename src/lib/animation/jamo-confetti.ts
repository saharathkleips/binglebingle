/**
 * @file jamo-confetti.ts
 *
 * Lightweight celebratory burst made from Hangul Compatibility Jamo.
 */

import { gsap } from "./register";

const JAMO_CONFETTI_CHARACTERS = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
  "ㅏ",
  "ㅑ",
  "ㅓ",
  "ㅕ",
  "ㅗ",
  "ㅛ",
  "ㅜ",
  "ㅠ",
  "ㅡ",
  "ㅣ",
] as const;

const JAMO_CONFETTI_COLORS = [
  "var(--color-confetti-jade)",
  "var(--color-confetti-mint)",
  "var(--color-confetti-gold)",
  "var(--color-confetti-yellow)",
  "var(--color-confetti-red)",
  "var(--color-confetti-blossom)",
] as const;

const PARTICLE_COUNT = 200;
const CENTER_PARTICLE_INTERVAL = 4;
const MIN_CENTER_TRAVEL_DISTANCE = 28;
const MAX_CENTER_TRAVEL_DISTANCE = 120;
const MIN_TRAVEL_DISTANCE = 140;
const MAX_TRAVEL_DISTANCE = 340;
const MIN_DURATION = 1.35;
const MAX_DURATION = 2.15;
const BASELINE_VIEWPORT_WIDTH = 390;
const BASELINE_VIEWPORT_HEIGHT = 700;
const BASELINE_VIEWPORT_DIAGONAL = Math.hypot(BASELINE_VIEWPORT_WIDTH, BASELINE_VIEWPORT_HEIGHT);
const MAX_PARTICLE_SCALE = 1.8;
const MAX_DISTANCE_SCALE = 2.35;
const MAX_FONT_SCALE = 1.18;
const PARTICLE_FONT_SIZE_REM = 1.6;

type ConfettiMetrics = {
  distanceScale: number;
  fontScale: number;
  particleCount: number;
};

type ParticleMotion = {
  duration: number;
  fallY: number;
  travelX: number;
  travelY: number;
};

/** Options for a jamo confetti burst. */
export type JamoConfettiOptions = {
  /** Element whose center is used as the burst origin. */
  originElement: HTMLElement;
};

/** Starts a one-shot jamo confetti burst and returns a cleanup function. */
export function triggerJamoConfetti({ originElement }: JamoConfettiOptions): () => void {
  if (typeof window === "undefined" || shouldReduceMotion()) return () => {};

  const metrics = getResponsiveConfettiMetrics();
  const originRect = originElement.getBoundingClientRect();
  const originX = originRect.left + originRect.width / 2;
  const originY = originRect.top + originRect.height / 2;
  const container = createConfettiContainer();
  const particles = Array.from({ length: metrics.particleCount }, () =>
    createJamoParticle(originX, originY, metrics.fontScale),
  );

  container.append(...particles);
  document.body.append(container);

  const timeline = gsap.timeline({
    onComplete: () => container.remove(),
    onInterrupt: () => container.remove(),
  });

  particles.forEach((particle, particleIndex) => {
    const particleMotion = getParticleMotion(particleIndex, metrics);
    timeline.add(createParticleTimeline(particle, particleMotion, metrics), 0);
  });

  return () => {
    timeline.kill();
    container.remove();
  };
}

function createConfettiContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.pointerEvents = "none";
  container.style.overflow = "visible";
  container.style.zIndex = "1000";
  return container;
}

function createJamoParticle(originX: number, originY: number, fontScale: number): HTMLSpanElement {
  const particle = document.createElement("span");
  particle.textContent = randomItem(JAMO_CONFETTI_CHARACTERS);
  particle.style.position = "absolute";
  particle.style.left = `${originX}px`;
  particle.style.top = `${originY}px`;
  particle.style.color = randomItem(JAMO_CONFETTI_COLORS);
  particle.style.fontFamily = "var(--font-family-tile)";
  particle.style.fontSize = `${PARTICLE_FONT_SIZE_REM * fontScale}rem`;
  particle.style.fontWeight = "var(--font-weight-tile)";
  particle.style.lineHeight = "1";
  particle.style.textShadow = "2px 2px 0 rgb(0 0 0 / 0.5)";
  particle.style.transform = "translate(-50%, -50%)";
  particle.style.willChange = "transform, opacity";
  return particle;
}

function createParticleTimeline(
  particle: HTMLSpanElement,
  motion: ParticleMotion,
  metrics: ConfettiMetrics,
): gsap.core.Timeline {
  const driftX = randomScaledBetween(-28, 28, metrics.distanceScale);

  return gsap
    .timeline()
    .fromTo(
      particle,
      { scale: 0.35, opacity: 0, rotate: randomBetween(-30, 30) },
      {
        x: motion.travelX,
        y: motion.travelY,
        scale: randomBetween(0.85, 1.28),
        opacity: 1,
        rotate: randomBetween(-180, 180),
        duration: motion.duration * 0.3,
        ease: "power2.out",
      },
    )
    .to(particle, {
      x: motion.travelX + driftX,
      y: motion.fallY,
      rotate: randomBetween(-360, 360),
      duration: motion.duration * 0.7,
      ease: "sine.inOut",
    })
    .to(
      particle,
      {
        opacity: 0,
        duration: motion.duration * 0.14,
        ease: "power1.in",
      },
      motion.duration * 0.86,
    );
}

function getParticleMotion(particleIndex: number, metrics: ConfettiMetrics): ParticleMotion {
  const angle =
    -Math.PI + (Math.PI * 2 * particleIndex) / metrics.particleCount + randomBetween(-0.28, 0.28);
  const isCenterParticle = particleIndex % CENTER_PARTICLE_INTERVAL === 0;
  const distance = isCenterParticle
    ? randomScaledBetween(
        MIN_CENTER_TRAVEL_DISTANCE,
        MAX_CENTER_TRAVEL_DISTANCE,
        metrics.distanceScale,
      )
    : randomScaledBetween(MIN_TRAVEL_DISTANCE, MAX_TRAVEL_DISTANCE, metrics.distanceScale);
  const travelX = Math.cos(angle) * distance;
  const travelY =
    Math.sin(angle) * distance -
    (isCenterParticle
      ? randomScaledBetween(18, 76, metrics.distanceScale)
      : randomScaledBetween(72, 170, metrics.distanceScale));
  const fallY =
    travelY +
    (isCenterParticle
      ? randomScaledBetween(90, 210, metrics.distanceScale)
      : randomScaledBetween(180, 360, metrics.distanceScale));

  return {
    duration: randomBetween(MIN_DURATION, MAX_DURATION),
    fallY,
    travelX,
    travelY,
  };
}

function getResponsiveConfettiMetrics(): ConfettiMetrics {
  const viewportDiagonal = Math.hypot(window.innerWidth, window.innerHeight);
  const distanceScale = clamp(viewportDiagonal / BASELINE_VIEWPORT_DIAGONAL, 1, MAX_DISTANCE_SCALE);
  const particleScale = clamp(Math.sqrt(distanceScale), 1, MAX_PARTICLE_SCALE);
  const fontScale = clamp(Math.sqrt(distanceScale), 1, MAX_FONT_SCALE);

  return {
    distanceScale,
    fontScale,
    particleCount: Math.round(PARTICLE_COUNT * particleScale),
  };
}

function shouldReduceMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

function randomScaledBetween(minimum: number, maximum: number, scale: number): number {
  return randomBetween(minimum * scale, maximum * scale);
}

function randomItem<const Item>(items: readonly Item[]): Item {
  return items[Math.floor(Math.random() * items.length)]!;
}
