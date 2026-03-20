import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CrashEngine } from '../engine/crash-engine.js';
import { GamePhase } from '@crash/shared';

describe('CrashEngine', () => {
  let engine: CrashEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new CrashEngine({ chainLength: 100 });
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  it('starts in WAITING phase', () => {
    expect(engine.phase).toBe(GamePhase.WAITING);
  });

  it('transitions WAITING → COUNTDOWN after waiting period', () => {
    const onPhaseChange = vi.fn();
    engine.on('phaseChange', onPhaseChange);
    engine.start();
    vi.advanceTimersByTime(5000);
    expect(onPhaseChange).toHaveBeenCalledWith(GamePhase.COUNTDOWN);
  });

  it('transitions COUNTDOWN → FLYING after countdown period', () => {
    const phases: GamePhase[] = [];
    engine.on('phaseChange', (p: GamePhase) => phases.push(p));
    engine.start();
    vi.advanceTimersByTime(5000 + 3000);
    expect(phases).toContain(GamePhase.FLYING);
  });

  it('emits tick events during FLYING phase', () => {
    const onTick = vi.fn();
    engine.on('tick', onTick);
    engine.start();
    vi.advanceTimersByTime(5000 + 3000 + 500);
    expect(onTick).toHaveBeenCalled();
    const lastCall = onTick.mock.calls[onTick.mock.calls.length - 1];
    expect(lastCall[0]).toHaveProperty('multiplier');
    expect(lastCall[0]).toHaveProperty('elapsed');
  });

  it('crashes when multiplier reaches crash point', () => {
    const onCrash = vi.fn();
    engine.on('crash', onCrash);
    engine.start();
    vi.advanceTimersByTime(5000 + 3000 + 120_000);
    expect(onCrash).toHaveBeenCalled();
    expect(engine.phase).toBe(GamePhase.CRASHED);
  });

  it('provides round data including hash and crash point', () => {
    const onCrash = vi.fn();
    engine.on('crash', onCrash);
    engine.start();
    vi.advanceTimersByTime(5000 + 3000 + 120_000);
    const crashData = onCrash.mock.calls[0][0];
    expect(crashData).toHaveProperty('crashPoint');
    expect(crashData).toHaveProperty('hash');
    expect(crashData).toHaveProperty('serverSeed');
    expect(crashData.crashPoint).toBeGreaterThanOrEqual(1.0);
  });

  it('returns to WAITING after crash', () => {
    const phases: GamePhase[] = [];
    engine.on('phaseChange', (p: GamePhase) => phases.push(p));
    engine.start();
    vi.advanceTimersByTime(5000 + 3000 + 120_000 + 3000);
    expect(phases[phases.length - 1]).toBe(GamePhase.WAITING);
  });
});
