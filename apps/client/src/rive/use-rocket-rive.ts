import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';
import { GamePhase } from '@crash/shared';
import { useGameStore } from '../store/game-store.js';

const ROCKET_RIV_SRC = '/rocket.riv';
const STATE_MACHINE_NAME = 'RocketStateMachine';

export interface RocketRiveResult {
  RiveComponent: React.ComponentType<React.HTMLAttributes<HTMLCanvasElement>> | null;
  isLoaded: boolean;
  hasError: boolean;
}

export function useRocketRive(): RocketRiveResult {
  const phase = useGameStore((s) => s.phase);

  const { rive, RiveComponent } = useRive({
    src: ROCKET_RIV_SRC,
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
    onLoadError: () => {
      // Gracefully handled — isLoaded remains false
    },
  });

  // Map game phase to a numeric input (0=idle, 1=flying, 2=crashed)
  const phaseInput = useStateMachineInput(rive, STATE_MACHINE_NAME, 'phase');

  useEffect(() => {
    if (!phaseInput) return;
    switch (phase) {
      case GamePhase.WAITING:
      case GamePhase.COUNTDOWN:
        phaseInput.value = 0;
        break;
      case GamePhase.FLYING:
        phaseInput.value = 1;
        break;
      case GamePhase.CRASHED:
        phaseInput.value = 2;
        break;
    }
  }, [phase, phaseInput]);

  const isLoaded = rive != null;
  const hasError = !isLoaded;

  return {
    RiveComponent: isLoaded ? (RiveComponent as React.ComponentType<React.HTMLAttributes<HTMLCanvasElement>>) : null,
    isLoaded,
    hasError,
  };
}
