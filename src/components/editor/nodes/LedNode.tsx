"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { inputPort } from "@/lib/circuit/types";
import type { CircuitNode } from "@/store/circuitStore";
import { useSignal } from "../SimulationContext";
import { LedShape } from "../shapes";

function LedNode({ id, selected }: NodeProps<CircuitNode>) {
  const lit = useSignal(id);
  return (
    <div
      className={`cd-node ${selected ? "cd-node--selected" : ""} ${lit ? "cd-led--lit" : ""}`}
      style={{ width: 40, height: 40 }}
      title={lit ? "LED: 켜짐" : "LED: 꺼짐"}
    >
      <LedShape lit={lit} className="h-full w-full" />
      <Handle type="target" position={Position.Left} id={inputPort(0)} className="cd-handle" />
    </div>
  );
}

export default memo(LedNode);
