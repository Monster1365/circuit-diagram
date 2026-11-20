"use client";

import { useNodeConnections, useNodeId } from "@xyflow/react";
import { CATALOG } from "@/lib/circuit/catalog";
import { portKey } from "@/lib/circuit/contacts";
import { inputPort, type ComponentKind } from "@/lib/circuit/types";
import { useSignalsOf, useSimulation } from "../SimulationContext";

/** 각 입력 포트에 들어오는 신호 (선 또는 맞닿은 연결점, 연결 안 됨 = false) */
export function useInputSignals(kind: ComponentKind): boolean[] {
  const nodeId = useNodeId();
  const connections = useNodeConnections({ handleType: "target" });
  const { contactDrivers } = useSimulation();
  const drivers = CATALOG[kind].inputYs.map((_, i) => {
    const handle = inputPort(i);
    return (
      connections.find((c) => c.targetHandle === handle)?.source ??
      (nodeId ? contactDrivers[portKey(nodeId, handle)] : undefined)
    );
  });
  return useSignalsOf(drivers);
}
