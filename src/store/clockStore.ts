import { create } from "zustand";

/** 클럭 레벨이 바뀐 시점 기록 (그래프용) */
export type ClockSample = { t: number; level: boolean };

/** 그래프에 그릴 수 있도록 남겨 두는 기록 길이(ms) */
export const HISTORY_MS = 60_000;

type ClockState = {
  /** 클럭 id → 현재 레벨 */
  levels: Record<string, boolean>;
  /** 클럭 id → 레벨 변화 기록 (시간순) */
  history: Record<string, ClockSample[]>;
  /** 클럭 레벨 반전 */
  flip: (id: string, t: number) => void;
  /** 처음 시작할 때 0 레벨로 기록 */
  start: (id: string, t: number) => void;
  /** 캔버스에 없는 클럭 정리 */
  prune: (ids: Set<string>) => void;
};

/**
 * 클럭의 현재 레벨과 기록. 시간에 따라 바뀌는 실행 상태라
 * 저장되는 회로 데이터(circuitStore)와 분리해 둔다.
 */
export const useClockStore = create<ClockState>((set) => ({
  levels: {},
  history: {},

  start: (id, t) =>
    set((state) =>
      id in state.levels
        ? state
        : {
            levels: { ...state.levels, [id]: false },
            history: { ...state.history, [id]: [{ t, level: false }] },
          },
    ),

  flip: (id, t) =>
    set((state) => {
      const level = !state.levels[id];
      const samples = (state.history[id] ?? []).filter((s) => s.t >= t - HISTORY_MS);
      return {
        levels: { ...state.levels, [id]: level },
        history: { ...state.history, [id]: [...samples, { t, level }] },
      };
    }),

  prune: (ids) =>
    set((state) => {
      const keep = <T,>(record: Record<string, T>) =>
        Object.fromEntries(Object.entries(record).filter(([id]) => ids.has(id)));
      return { levels: keep(state.levels), history: keep(state.history) };
    }),
}));
