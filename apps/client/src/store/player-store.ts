import { create } from 'zustand';

interface PlayerState {
  balance: number | null;
  betAmount: number;
  autoCashoutAt: number | null;
  hasActiveBet: boolean;
  cashedOutAt: number | null;
}

interface PlayerActions {
  setBetAmount: (amount: number) => void;
  setAutoCashout: (at: number | null) => void;
  cashOut: (winnings: number, balance: number, at: number) => void;
  resetForNewRound: () => void;
  setBalance: (balance: number | null) => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  // State
  balance: null,
  betAmount: 10,
  autoCashoutAt: null,
  hasActiveBet: false,
  cashedOutAt: null,

  // Actions
  setBetAmount: (betAmount) => set({ betAmount }),

  setAutoCashout: (autoCashoutAt) => set({ autoCashoutAt }),

  cashOut: (_winnings, balance, at) =>
    set({
      balance,
      hasActiveBet: false,
      cashedOutAt: at,
    }),

  resetForNewRound: () =>
    set({
      hasActiveBet: false,
      cashedOutAt: null,
    }),

  setBalance: (balance) => set({ balance }),
}));
