import { extend, useTick } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { useCallback, useRef } from 'react';
import { GamePhase } from '@crash/shared';
import { useGameStore } from '../../store/game-store.js';

extend({ Graphics });

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: number;
  decay: number;
}

const COLORS = [0xef4444, 0xf97316, 0xfbbf24, 0xfef08a, 0xffffff];
const GRAVITY = 0.12;

function spawnParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  const count = 28;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const speed = 2.5 + Math.random() * 5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      radius: 2 + Math.random() * 4,
      alpha: 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      decay: 0.018 + Math.random() * 0.012,
    });
  }

  return particles;
}

export function ExplosionEffect() {
  const graphicsRef = useRef<Graphics | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prevPhaseRef = useRef<GamePhase>(GamePhase.WAITING);

  const tick = useCallback((ticker: { deltaTime: number }) => {
    const g = graphicsRef.current;
    if (!g) return;

    const { phase, rocketPosition } = useGameStore.getState();
    const dt = ticker.deltaTime;

    if (phase === GamePhase.CRASHED && prevPhaseRef.current === GamePhase.FLYING) {
      particlesRef.current = spawnParticles(rocketPosition.x, rocketPosition.y);
    }
    prevPhaseRef.current = phase;

    if (phase === GamePhase.WAITING) {
      particlesRef.current = [];
    }

    g.clear();

    const alive: Particle[] = [];
    for (const p of particlesRef.current) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * dt;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) continue;
      alive.push(p);

      g.setFillStyle({ color: p.color, alpha: p.alpha });
      g.circle(p.x, p.y, p.radius);
      g.fill();
    }
    particlesRef.current = alive;
  }, []);

  useTick(tick);

  const drawCallback = useCallback((g: Graphics) => {
    graphicsRef.current = g;
  }, []);

  return <pixiGraphics draw={drawCallback} />;
}
