import { extend, useTick } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { useCallback, useRef } from 'react';
import { GamePhase } from '@crash/shared';
import { useGameStore } from '../../store/game-store.js';

extend({ Graphics });

const TRAIL_LENGTH = 20;
const SAMPLE_EVERY = 2;

interface TrailPoint {
  x: number;
  y: number;
}

export function RocketTrail() {
  const graphicsRef = useRef<Graphics | null>(null);
  const trailRef = useRef<TrailPoint[]>([]);
  const tickRef = useRef(0);

  const tick = useCallback(() => {
    const g = graphicsRef.current;
    if (!g) return;

    const { phase, rocketPosition } = useGameStore.getState();

    if (phase !== GamePhase.FLYING) {
      if (trailRef.current.length > 0) {
        trailRef.current = [];
        g.clear();
      }
      return;
    }

    tickRef.current++;
    if (tickRef.current % SAMPLE_EVERY === 0) {
      trailRef.current.push({ x: rocketPosition.x, y: rocketPosition.y });
      if (trailRef.current.length > TRAIL_LENGTH) trailRef.current.shift();
    }

    g.clear();

    const trail = trailRef.current;
    const len = trail.length;
    for (let i = 0; i < len; i++) {
      const t = i / (len - 1);
      const alpha = t * 0.6;
      const radius = 1.5 + t * 4.5;
      g.setFillStyle({ color: 0x22d3ee, alpha });
      g.circle(trail[i].x, trail[i].y, radius);
      g.fill();
    }
  }, []);

  useTick(tick);

  const drawCallback = useCallback((g: Graphics) => {
    graphicsRef.current = g;
  }, []);

  return <pixiGraphics draw={drawCallback} />;
}
