import { useEffect, useRef } from 'react';
import { GamePhase } from '@crash/shared';
import { useGameStore } from '../store/game-store.js';
import { usePlayerStore } from '../store/player-store.js';

function getAudioContext(): AudioContext | null {
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

function playTick(ctx: AudioContext, multiplier: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = Math.min(400, 80 + multiplier * 25);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

function playCashout(ctx: AudioContext) {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.linearRampToValueAtTime(1000, now + 0.08);
  osc.frequency.linearRampToValueAtTime(1400, now + 0.16);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

function playExplosion(ctx: AudioContext) {
  const now = ctx.currentTime;
  const duration = 0.9;

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 350;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(now);
  source.stop(now + duration);
}

export function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);
  const prevPhaseRef = useRef<GamePhase | null>(null);
  const prevCashedOutRef = useRef<number | null>(null);

  useEffect(() => {
    const init = () => {
      if (!ctxRef.current) {
        ctxRef.current = getAudioContext();
      }
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };
    window.addEventListener('click', init);
    window.addEventListener('keydown', init);
    return () => {
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };
  }, []);

  useEffect(() => {
    return useGameStore.subscribe((state) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const { phase, multiplier } = state;
      const prevPhase = prevPhaseRef.current;

      if (phase === GamePhase.FLYING) {
        const now = Date.now();
        if (now - lastTickRef.current >= 200) {
          lastTickRef.current = now;
          playTick(ctx, multiplier);
        }
      }

      if (prevPhase === GamePhase.FLYING && phase === GamePhase.CRASHED) {
        playExplosion(ctx);
      }

      prevPhaseRef.current = phase;
    });
  }, []);

  useEffect(() => {
    return usePlayerStore.subscribe((state) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const { cashedOutAt } = state;
      if (cashedOutAt !== null && cashedOutAt !== prevCashedOutRef.current) {
        prevCashedOutRef.current = cashedOutAt;
        playCashout(ctx);
      }
    });
  }, []);
}
