import { useGameStore } from '../store/game-store.js';
import { useRocketRive } from './use-rocket-rive.js';

const ROCKET_SIZE = 64;

export function RocketRive() {
  const rocketPosition = useGameStore((s) => s.rocketPosition);
  const { RiveComponent, hasError } = useRocketRive();

  const style: React.CSSProperties = {
    position: 'absolute',
    left: rocketPosition.x - ROCKET_SIZE / 2,
    top: rocketPosition.y - ROCKET_SIZE / 2,
    width: ROCKET_SIZE,
    height: ROCKET_SIZE,
    pointerEvents: 'none',
    transform: 'rotate(-45deg)',
    transition: 'left 16ms linear, top 16ms linear',
  };

  if (hasError || !RiveComponent) {
    return (
      <div style={style} className="flex items-center justify-center text-3xl select-none">
        🚀
      </div>
    );
  }

  return (
    <div style={style}>
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
