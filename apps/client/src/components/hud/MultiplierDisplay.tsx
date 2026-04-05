import { GamePhase } from '@crash/shared';
import { useGameStore } from '../../store/game-store.js';
import { formatMultiplier } from '../../lib/format.js';

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number,
): string {
  const r = Math.round(r1 + t * (r2 - r1));
  const g = Math.round(g1 + t * (g2 - g1));
  const b = Math.round(b1 + t * (b2 - b1));
  return `rgb(${r},${g},${b})`;
}

function getMultiplierColor(m: number): string {
  if (m <= 3) {
    const t = (m - 1) / 2;
    return lerpColor(34, 211, 238, 234, 179, 8, t);
  }
  const t = Math.min(1, (m - 3) / 7);
  return lerpColor(234, 179, 8, 239, 68, 68, t);
}

export function MultiplierDisplay() {
  const phase = useGameStore((s) => s.phase);
  const multiplier = useGameStore((s) => s.multiplier);
  const crashPoint = useGameStore((s) => s.crashPoint);

  if (phase === GamePhase.WAITING || phase === GamePhase.COUNTDOWN) {
    return null;
  }

  const isCrashed = phase === GamePhase.CRASHED;
  const displayValue = isCrashed && crashPoint != null ? crashPoint : multiplier;
  const color = isCrashed ? 'rgb(248,113,113)' : getMultiplierColor(displayValue);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
      {isCrashed && (
        <span className="text-xl font-bold tracking-widest uppercase mb-1 opacity-80" style={{ color }}>
          CRASHED
        </span>
      )}
      <span
        className="font-black tabular-nums"
        style={{
          color,
          fontSize: isCrashed ? '3.75rem' : '4.5rem',
          textShadow: isCrashed ? 'none' : `0 0 20px ${color}99`,
        }}
      >
        {formatMultiplier(displayValue)}
      </span>
    </div>
  );
}
