"use client";

import type { NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { CircuitNode } from "@/store/circuitStore";
import { useSignal } from "../SimulationContext";
import { LedShape } from "../shapes";
import Ports, { nodeSize } from "./Ports";

function LedNode({ id, data, selected }: NodeProps<CircuitNode>) {
  const lit = useSignal(id);
  return (
    <div
      className={`cd-node cd-node--round ${selected ? "cd-node--selected" : ""} ${lit ? "cd-led--lit" : ""}`}
      style={nodeSize("LED")}
      title={`${data.label ?? "LED"}: ${lit ? "켜짐" : "꺼짐"}`}
    >
      <LedShape lit={lit} className="h-full w-full" />
      <Ports kind="LED" />
      {data.label && <span className="cd-node-label">{data.label}</span>}
    </div>
  );
}

export default memo(LedNode);
