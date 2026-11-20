"use client";

import { createContext, useContext } from "react";
import type { SimResult } from "@/lib/circuit/types";

export type SimulationState = SimResult & {
  /** 선 없이 맞닿아 연결된 입력 포트("노드id:포트id") → 신호를 주는 노드 id */
  contactDrivers: Record<string, string>;
  /** 맞닿아 연결된 포트("노드id:포트id") 목록 (입력·출력 모두) */
  joinedPorts: ReadonlySet<string>;
};

const SimulationContext = createContext<SimulationState>({
  outputs: {},
  stable: true,
  contactDrivers: {},
  joinedPorts: new Set(),
});

export const SimulationProvider = SimulationContext.Provider;

/** 특정 노드의 출력 신호 (LED는 켜짐 여부) */
export function useSignal(nodeId: string): boolean {
  return useContext(SimulationContext).outputs[nodeId] ?? false;
}

/** 여러 노드의 출력 신호. id가 없으면 false */
export function useSignalsOf(ids: (string | undefined)[]): boolean[] {
  const { outputs } = useContext(SimulationContext);
  return ids.map((id) => (id ? (outputs[id] ?? false) : false));
}

export function useSimulationStable(): boolean {
  return useContext(SimulationContext).stable;
}

export function useSimulation(): SimulationState {
  return useContext(SimulationContext);
}
