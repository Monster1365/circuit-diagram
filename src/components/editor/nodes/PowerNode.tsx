"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { OUTPUT_PORT } from "@/lib/circuit/types";
import type { CircuitNode } from "@/store/circuitStore";
import { PowerShape } from "../shapes";

function PowerNode({ data, selected }: NodeProps<CircuitNode>) {
  return (
    <div
      className={`cd-node cd-node--box ${selected ? "cd-node--selected" : ""}`}
      title="전원: 클릭해서 켜고 끄기"
    >
      <PowerShape on={data.on} className="h-7 w-7" />
      <span className={`cd-badge ${data.on ? "cd-badge--on" : ""}`}>
        {data.on ? "ON" : "OFF"}
      </span>
      <Handle type="source" position={Position.Right} id={OUTPUT_PORT} className="cd-handle" />
    </div>
  );
}

export default memo(PowerNode);
