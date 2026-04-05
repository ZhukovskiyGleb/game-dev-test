export const GROWTH_RATE = 0.00006;

export enum GamePhase {
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  FLYING = 'flying',
  CRASHED = 'crashed',
}

export interface BotPlayer {
  id: string;
  name: string;
  betAmount: number;
  cashedOutAt: number | null;
}

export interface RoundResult {
  roundId: string;
  crashPoint: number;
  hash: string;
  timestamp: number;
}
