import { GamePhase } from '@crash/shared';
import { useGameStore } from '../store/game-store.js';

const ROCKET_SIZE = window.innerWidth < 768 ? 50 : 80;

export function RocketRive() {
  const rocketPosition = useGameStore((s) => s.rocketPosition);
  const phase = useGameStore((s) => s.phase);
  const multiplier = useGameStore((s) => s.multiplier);

  const isFlying = phase === GamePhase.FLYING;

  if (!isFlying) return null;

  const normalized = Math.min(1, (multiplier - 1) / 9);
  const rotation = -45 - (normalized * 45);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: rocketPosition.x - ROCKET_SIZE / 2,
    top: rocketPosition.y - ROCKET_SIZE / 2,
    width: ROCKET_SIZE,
    height: ROCKET_SIZE,
    pointerEvents: 'none',
    transition: 'left 16ms linear, top 16ms linear, transform 80ms ease-out',
    transform: `rotate(${rotation}deg)`,
  };

  return (
    <div style={style}>
      <svg
        viewBox="-24 -12 48 24"
        width={ROCKET_SIZE}
        height={ROCKET_SIZE}
        overflow="visible"
      >
        <ellipse cx="-19" cy="0" rx="7" ry="3.5" fill="#f97316" opacity="0.9">
          <animate attributeName="rx" values="7;11;5;10;7" dur="0.14s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.6;1;0.75;0.9" dur="0.14s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="-21" cy="0" rx="5" ry="2" fill="#fde68a">
          <animate attributeName="rx" values="5;8;3;7;5" dur="0.09s" repeatCount="indefinite" />
        </ellipse>

        <polygon points="-10,-7 -19,-15 -5,-7" fill="#475569" />
        <polygon points="-10,7  -19,15  -5,7"  fill="#475569" />

        <ellipse cx="2" cy="0" rx="16" ry="7" fill="#e2e8f0" />

        <polygon points="18,0 5,-5 5,5" fill="#94a3b8" />

        <ellipse cx="-13" cy="0" rx="3.5" ry="4" fill="#334155" />

        <circle cx="6" cy="0" r="3.2" fill="#0e7490" />
        <circle cx="6" cy="0" r="2"   fill="#22d3ee" opacity="0.85" />
        <circle cx="5" cy="-0.8" r="0.7" fill="#cffafe" opacity="0.6" />
      </svg>
    </div>
  );
}
