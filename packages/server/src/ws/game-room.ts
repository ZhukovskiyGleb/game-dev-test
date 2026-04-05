import { WebSocket } from 'ws';
import { GamePhase, type BotPlayer, type RoundResult, clientMessageSchema, type ServerMessage } from '@crash/shared';
import { CrashEngine } from '../engine/crash-engine.js';
import { BotManager } from '../engine/bot-manager.js';

const STARTING_BALANCE = 1000;
const MAX_HISTORY = 50;
const MAX_PLAYERS = 10_000;

interface PlayerBet {
  amount: number;
  autoCashoutAt: number | null;
}

export class GameRoom {
  private engine: CrashEngine;
  private botManager: BotManager;
  private clients = new Set<WebSocket>();
  private clientIds = new Map<WebSocket, string>();
  private clientSockets = new Map<string, WebSocket>();
  private playerBalances = new Map<string, number>();
  private playerBets = new Map<string, PlayerBet>();
  private roundHistory: RoundResult[] = [];
  private currentBots: BotPlayer[] = [];
  private currentMultiplier = 1.0;
  private currentElapsed = 0;

  constructor() {
    this.engine = new CrashEngine();
    this.botManager = new BotManager();
    this.wireEngineEvents();
  }

  private wireEngineEvents(): void {
    this.engine.on('roundWaiting', ({ roundId, nextHash }: { roundId: string; nextHash: string }) => {
      this.playerBets.clear();
      this.currentMultiplier = 1.0;
      this.currentElapsed = 0;

      this.currentBots = this.botManager.generateBots();

      this.broadcast({ type: 'round:waiting', roundId, nextHash });
      this.broadcast({ type: 'bots:update', bots: this.currentBots });
    });

    this.engine.on('countdown', ({ startsIn }: { startsIn: number }) => {
      this.broadcast({ type: 'round:countdown', startsIn });
    });

    this.engine.on('roundStart', ({ roundId, startedAt }: { roundId: string; startedAt: number }) => {
      this.broadcast({ type: 'round:start', roundId, startedAt });
    });

    this.engine.on('tick', ({ multiplier, elapsed }: { multiplier: number; elapsed: number }) => {
      this.currentMultiplier = multiplier;
      this.currentElapsed = elapsed;

      this.broadcast({ type: 'round:tick', multiplier, elapsed });

      const newCashouts = this.botManager.processCashouts(multiplier);
      for (const bot of newCashouts) {
        this.broadcast({ type: 'bot:cashout', botId: bot.id, at: bot.cashedOutAt! });
      }

      this.processAutoCashouts(multiplier);
    });

    this.engine.on('crash', ({ crashPoint, serverSeed, hash, roundId }: {
      crashPoint: number;
      serverSeed: string;
      hash: string;
      roundId: string;
    }) => {
      this.broadcast({ type: 'round:crash', crashPoint, serverSeed, hash });

      const result: RoundResult = {
        roundId,
        crashPoint,
        hash,
        timestamp: Date.now(),
      };
      this.roundHistory.unshift(result);
      if (this.roundHistory.length > MAX_HISTORY) {
        this.roundHistory.pop();
      }

      this.playerBets.clear();
    });
  }

  private processAutoCashouts(multiplier: number): void {
    for (const [playerId, bet] of this.playerBets.entries()) {
      if (bet.autoCashoutAt !== null && multiplier >= bet.autoCashoutAt) {
        this.executeCashout(playerId, multiplier);
      }
    }
  }

  private getBalance(ws: WebSocket): number {
    const playerId = this.clientIds.get(ws);
    if (playerId) return this.playerBalances.get(playerId) ?? STARTING_BALANCE;
    return STARTING_BALANCE;
  }

  private setBalance(ws: WebSocket, balance: number): void {
    const playerId = this.clientIds.get(ws);
    if (!playerId) return;
    if (this.playerBalances.has(playerId)) {
      this.playerBalances.delete(playerId);
    } else if (this.playerBalances.size >= MAX_PLAYERS) {
      this.playerBalances.delete(this.playerBalances.keys().next().value!);
    }
    this.playerBalances.set(playerId, balance);
  }

  private executeCashout(playerId: string, multiplier: number): void {
    const bet = this.playerBets.get(playerId);
    if (!bet) return;

    const ws = this.clientSockets.get(playerId);
    if (!ws) return;

    const winnings = bet.amount * multiplier;
    const newBalance = this.getBalance(ws) + winnings;
    this.setBalance(ws, newBalance);
    this.playerBets.delete(playerId);

    const msg: ServerMessage = {
      type: 'player:cashout_accepted',
      winnings,
      balance: newBalance,
      at: multiplier,
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  addClient(ws: WebSocket): void {
    this.clients.add(ws);
  }

  private sendStateSync(ws: WebSocket): void {
    const playerId = this.clientIds.get(ws);
    const bet = playerId ? this.playerBets.get(playerId) : undefined;
    const syncMsg: ServerMessage = {
      type: 'state:sync',
      phase: this.engine.phase,
      roundId: this.engine.getCurrentRoundId(),
      multiplier: this.currentMultiplier,
      elapsed: this.currentElapsed,
      bots: this.currentBots,
      balance: this.getBalance(ws),
      playerBet: bet ? { amount: bet.amount, autoCashoutAt: bet.autoCashoutAt } : null,
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(syncMsg));
    }
  }

  removeClient(ws: WebSocket): void {
    const playerId = this.clientIds.get(ws);
    if (playerId) this.clientSockets.delete(playerId);
    this.clients.delete(ws);
    this.clientIds.delete(ws);
  }

  handleMessage(ws: WebSocket, raw: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.sendError(ws, 'INVALID_JSON', 'Message is not valid JSON');
      return;
    }

    const result = clientMessageSchema.safeParse(parsed);
    if (!result.success) {
      this.sendError(ws, 'INVALID_MESSAGE', result.error.message);
      return;
    }

    const msg = result.data;

    if (msg.type === 'client:identify') {
      this.clientIds.set(ws, msg.playerId);
      this.clientSockets.set(msg.playerId, ws);
      if (!this.playerBalances.has(msg.playerId)) {
        if (this.playerBalances.size >= MAX_PLAYERS) {
          this.playerBalances.delete(this.playerBalances.keys().next().value!);
        }
        this.playerBalances.set(msg.playerId, STARTING_BALANCE);
      }
      this.sendStateSync(ws);
      return;
    }

    if (!this.clientIds.has(ws)) {
      this.sendError(ws, 'NOT_IDENTIFIED', 'Send client:identify first');
      return;
    }

    const playerId = this.clientIds.get(ws)!;

    if (msg.type === 'bet:place') {
      if (this.engine.phase !== GamePhase.WAITING) {
        this.sendError(ws, 'INVALID_PHASE', 'Bets only accepted during waiting phase');
        return;
      }

      if (this.playerBets.has(playerId)) {
        this.sendError(ws, 'BET_EXISTS', 'You already have an active bet');
        return;
      }

      const balance = this.getBalance(ws);
      if (msg.amount > balance) {
        this.sendError(ws, 'INSUFFICIENT_BALANCE', 'Insufficient balance');
        return;
      }

      const newBalance = balance - msg.amount;
      this.setBalance(ws, newBalance);
      this.playerBets.set(playerId, {
        amount: msg.amount,
        autoCashoutAt: msg.autoCashoutAt ?? null,
      });

      const response: ServerMessage = {
        type: 'player:bet_accepted',
        balance: newBalance,
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(response));
      }
    } else if (msg.type === 'bet:cashout') {
      if (this.engine.phase !== GamePhase.FLYING) {
        this.sendError(ws, 'INVALID_PHASE', 'Cashout only available during flying phase');
        return;
      }

      if (!this.playerBets.has(playerId)) {
        this.sendError(ws, 'NO_BET', 'No active bet to cash out');
        return;
      }

      const multiplier = this.engine.getCurrentMultiplier();
      this.executeCashout(playerId, multiplier);
    }
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    const msg: ServerMessage = { type: 'error', code, message };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  private broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  start(): void {
    this.engine.start();
  }

  getHistory(): RoundResult[] {
    return [...this.roundHistory];
  }

  getTerminatingHash(): string {
    return this.engine.terminatingHash;
  }
}
