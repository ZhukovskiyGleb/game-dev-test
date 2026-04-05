import { extend, useTick } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { useCallback, useRef } from 'react';
import { GamePhase } from '@crash/shared';
import { useGameStore } from '../../store/game-store.js';
import { liveMultiplier } from '../../lib/live-multiplier.js';
import {
  calculateViewport,
  getMultiplierAtTime,
  worldToScreen,
} from '../utils/curve-math.js';

extend({ Graphics });

interface MultiplierCurveProps {
  width: number;
  height: number;
}

const STEPS = 120;
const FADE_DURATION = 600;

export function MultiplierCurve({ width, height }: MultiplierCurveProps) {
  const graphicsRef = useRef<Graphics | null>(null);
  const pointsRef = useRef(new Float32Array(STEPS * 2));
  const crashedAtRef = useRef<number | null>(null);
  const prevPhaseRef = useRef<GamePhase | null>(null);

  const tick = useCallback(() => {
    const g = graphicsRef.current;
    if (!g) return;

    const { phase, roundStartedAt, setRocketPosition } =
      useGameStore.getState();
    const multiplier = liveMultiplier.current;

    if (phase === GamePhase.FLYING && prevPhaseRef.current !== GamePhase.FLYING) {
      crashedAtRef.current = null;
    }
    if (phase === GamePhase.CRASHED && prevPhaseRef.current === GamePhase.FLYING) {
      crashedAtRef.current = Date.now();
    }
    prevPhaseRef.current = phase;

    const isFlying = phase === GamePhase.FLYING;
    const isCrashed = phase === GamePhase.CRASHED;

    if (!isFlying && !isCrashed) {
      g.clear();
      return;
    }

    if (isCrashed && crashedAtRef.current !== null) {
      const elapsed = Date.now() - crashedAtRef.current;
      if (elapsed >= FADE_DURATION) {
        g.clear();
        return;
      }
    }

    const elapsedMs =
      roundStartedAt != null ? Date.now() - roundStartedAt : 0;

    const viewport = calculateViewport(multiplier, Math.max(elapsedMs, 1000), width, height);

    g.clear();

    const fadeAlpha = isCrashed && crashedAtRef.current !== null
      ? Math.max(0, 1 - (Date.now() - crashedAtRef.current) / FADE_DURATION)
      : 1;

    const color = isCrashed ? 0xef4444 : 0x22d3ee;
    const origin = worldToScreen(0, 1.0, viewport, width, height);
    const pts = pointsRef.current;
    let count = 0;

    for (let i = 1; i <= STEPS; i++) {
      const t = (i / STEPS) * elapsedMs;
      const m = getMultiplierAtTime(t);
      if (m > multiplier + 0.05) break;
      const p = worldToScreen(t, m, viewport, width, height);
      pts[count * 2] = p.x;
      pts[count * 2 + 1] = p.y;
      count++;
    }

    if (count === 0) return;

    const drawPath = () => {
      g.moveTo(origin.x, origin.y);
      for (let i = 0; i < count; i++) g.lineTo(pts[i * 2], pts[i * 2 + 1]);
    };

    g.setStrokeStyle({ width: 16, color, alpha: 0.08 * fadeAlpha });
    drawPath();
    g.stroke();

    g.setStrokeStyle({ width: 7, color, alpha: 0.22 * fadeAlpha });
    drawPath();
    g.stroke();

    g.setStrokeStyle({ width: 2.5, color, alpha: fadeAlpha });
    drawPath();
    g.stroke();

    const lastX = pts[(count - 1) * 2];
    const lastY = pts[(count - 1) * 2 + 1];

    if (isFlying) {
      g.setFillStyle({ color, alpha: 0.25 });
      g.circle(lastX, lastY, 12);
      g.fill();

      g.setFillStyle({ color, alpha: 1 });
      g.circle(lastX, lastY, 5);
      g.fill();

      setRocketPosition({ x: lastX, y: lastY });
    }
  }, [width, height]);

  useTick(tick);

  const drawCallback = useCallback((g: Graphics) => {
    graphicsRef.current = g;
  }, []);

  return <pixiGraphics draw={drawCallback} />;
}
