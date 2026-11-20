"use client";

import { useNodeConnections } from "@xyflow/react";
import { CATALOG } from "@/lib/circuit/catalog";
import { inputPort, type ComponentKind } from "@/lib/circuit/types";
import { useSignalsOf } from "../SimulationContext";

/** 각 입력 포트에 들어오는 신호 (연결 안 됨 = false) */
export function useInputSignals(kind: ComponentKind): boolean[] {
  const connections = useNodeConnections({ handleType: "target" });
  const drivers = CATALOG[kind].inputYs.map(
    (_, i) => connections.find((c) => c.targetHandle === inputPort(i))?.source,
  );
  return useSignalsOf(drivers);
}
