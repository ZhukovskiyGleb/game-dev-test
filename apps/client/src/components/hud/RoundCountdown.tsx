import { useEffect, useState } from 'react';
import { GamePhase } from '@crash/shared';
import { useGameStore } from '../../store/game-store.js';

export function RoundCountdown() {
  const phase = useGameStore((s) => s.phase);
  const countdownEndsAt = useGameStore((s) => s.countdownEndsAt);
  const [remaining, setRemaining] = useState(3);

  useEffect(() => {
    if (phase !== GamePhase.COUNTDOWN || countdownEndsAt === null) {
      setRemaining(3);
      return;
    }

    const tick = () => {
      const secs = Math.ceil((countdownEndsAt - Date.now()) / 1000);
      setRemaining(Math.max(0, secs));
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [phase, countdownEndsAt]);

  if (phase === GamePhase.WAITING) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-gray-400 text-2xl font-semibold animate-pulse">
          Place your bets...
        </span>
      </div>
    );
  }

  if (phase === GamePhase.COUNTDOWN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-cyan-400 text-8xl font-black animate-ping-once">
          {remaining > 0 ? remaining : 'GO!'}
        </span>
      </div>
    );
  }

  return null;
}
