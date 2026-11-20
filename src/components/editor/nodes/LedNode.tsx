"use client";

import type { NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { CircuitNode } from "@/store/circuitStore";
import { useSignal } from "../SimulationContext";
import { LedShape } from "../shapes";
import NodeFrame from "./NodeFrame";

function LedNode({ id, data, selected }: NodeProps<CircuitNode>) {
  const lit = useSignal(id);
  return (
    <NodeFrame
      data={data}
      selected={selected}
      className={`cd-node--round ${lit ? "cd-led--lit" : ""}`}
      title={`${data.label ?? "LED"}: ${lit ? "켜짐" : "꺼짐"}`}
    >
      <LedShape lit={lit} className="h-full w-full" />
    </NodeFrame>
  );
}

export default memo(LedNode);
