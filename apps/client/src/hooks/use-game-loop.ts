import { useEffect, useRef } from 'react';
import { GamePhase, GROWTH_RATE } from '@crash/shared';
import { useGameStore } from '../store/game-store.js';
import { liveMultiplier } from '../lib/live-multiplier.js';
import { liveFps } from '../lib/live-fps.js';

const UI_UPDATE_INTERVAL = 1000 / 15;

function interpolateMultiplier(elapsedMs: number): number {
  return Math.exp(elapsedMs * GROWTH_RATE);
}

export function useGameLoop() {
  const rafRef = useRef<number | null>(null);
  const lastUiUpdateRef = useRef(0);
  const fpsFrameCountRef = useRef(0);
  const fpsLastFlushRef = useRef(0);

  useEffect(() => {
    function tick(now: number) {
      fpsFrameCountRef.current++;
      const fpsDelta = now - fpsLastFlushRef.current;
      if (fpsDelta >= 1000) {
        liveFps.current = Math.round(fpsFrameCountRef.current * 1000 / fpsDelta);
        fpsFrameCountRef.current = 0;
        fpsLastFlushRef.current = now;
      }

      if (!document.hidden) {
        const { phase, roundStartedAt, setMultiplier } = useGameStore.getState();

        if (phase === GamePhase.FLYING && roundStartedAt !== null) {
          const elapsed = Date.now() - roundStartedAt;
          const multiplier = interpolateMultiplier(elapsed);
          liveMultiplier.current = multiplier;

          if (now - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL) {
            lastUiUpdateRef.current = now;
            setMultiplier(multiplier);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
}
