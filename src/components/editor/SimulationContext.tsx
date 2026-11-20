"use client";

import { createContext, useContext } from "react";
import type { SimResult } from "@/lib/circuit/types";

const SimulationContext = createContext<SimResult>({ outputs: {}, stable: true });

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

export function useSimulation(): SimResult {
  return useContext(SimulationContext);
}
