import { useCallback, useEffect, useRef, useState } from 'react';
import { GamePhase } from '@crash/shared';
import { useGameSocket } from './hooks/use-game-socket.js';
import { useGameLoop } from './hooks/use-game-loop.js';
import { useGameSounds } from './hooks/use-game-sounds.js';
import { useFps } from './hooks/use-fps.js';
import { useGameStore } from './store/game-store.js';
import { usePlayerStore } from './store/player-store.js';
import { GameCanvas } from './canvas/GameCanvas.js';
import { CanvasErrorBoundary } from './canvas/CanvasErrorBoundary.js';
import { RocketRive } from './rive/RocketRive.js';
import { MultiplierDisplay } from './components/hud/MultiplierDisplay.js';
import { RoundCountdown } from './components/hud/RoundCountdown.js';
import { BetPanel } from './components/hud/BetPanel.js';
import { PlayerList } from './components/social/PlayerList.js';
import { RoundHistory } from './components/history/RoundHistory.js';
import { VerifyModal } from './components/fairness/VerifyModal.js';

export function App() {
  const { send } = useGameSocket();
  useGameLoop();
  useGameSounds();
  const fps = useFps();

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const connected = useGameStore((s) => s.connected);
  const phase = useGameStore((s) => s.phase);
  const crashPoint = useGameStore((s) => s.crashPoint);

  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (phase === GamePhase.CRASHED && prevPhaseRef.current === GamePhase.FLYING) {
      setIsShaking(true);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  // ResizeObserver for canvas container
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
        }
        rafId = null;
      });
    });

    observer.observe(container);
    // Set initial size
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setCanvasSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  const handlePlaceBet = useCallback(
    (amount: number, autoCashout: number | undefined) => {
      const currentPhase = useGameStore.getState().phase;
      if (currentPhase !== GamePhase.WAITING) return;

      send({ type: 'bet:place', amount, autoCashoutAt: autoCashout });
    },
    [send],
  );

  const handleCashOut = useCallback(() => {
    const { hasActiveBet } = usePlayerStore.getState();
    if (!hasActiveBet) return;

    send({ type: 'bet:cashout' });
  }, [send]);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white overflow-hidden">
      {/* History bar */}
      <RoundHistory />

      {/* Main content */}
      <div className="flex flex-col md:flex-row flex-1 gap-2 md:gap-4 p-2 md:p-4 min-h-0 overflow-hidden">
        {/* Canvas area */}
        <div
          ref={canvasContainerRef}
          className={`flex-1 relative bg-gray-900/50 rounded-lg overflow-hidden min-h-0${isShaking ? ' screen-shake' : ''}`}
          onAnimationEnd={() => setIsShaking(false)}
        >
          <CanvasErrorBoundary>
            <GameCanvas width={canvasSize.width} height={canvasSize.height} />
            <RocketRive />
            <MultiplierDisplay />
            <RoundCountdown />
          </CanvasErrorBoundary>
        </div>

        {/* Sidebar */}
        <aside className="w-full md:w-72 shrink-0 flex flex-col gap-3 overflow-x-auto md:overflow-x-visible">
          <div className="flex flex-row md:flex-col gap-3 md:flex-1 md:min-h-0 bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="flex-1 min-w-[260px] md:min-w-0">
              <BetPanel onPlaceBet={handlePlaceBet} onCashOut={handleCashOut} />
            </div>
            <div className="flex-1 min-w-[200px] md:min-w-0 hidden md:flex md:flex-col md:flex-1 md:min-h-0">
              <PlayerList />
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span>
            {phase === GamePhase.CRASHED && crashPoint != null
              ? `Crashed at ${crashPoint.toFixed(2)}x`
              : `Phase: ${phase}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-mono ${fps >= 50 ? 'text-emerald-500' : fps >= 30 ? 'text-yellow-500' : 'text-red-500'}`}>
            {fps} FPS
          </span>
          <button
            onClick={() => setVerifyOpen(true)}
            className="text-gray-400 hover:text-cyan-400 transition-colors underline-offset-2 hover:underline"
          >
            Verify fairness
          </button>
        </div>
      </footer>

      <VerifyModal isOpen={verifyOpen} onClose={() => setVerifyOpen(false)} />
    </div>
  );
}
