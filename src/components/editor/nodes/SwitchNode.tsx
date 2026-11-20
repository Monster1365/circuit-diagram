"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { OUTPUT_PORT, inputPort } from "@/lib/circuit/types";
import type { CircuitNode } from "@/store/circuitStore";
import { SwitchShape } from "../shapes";

function SwitchNode({ data, selected }: NodeProps<CircuitNode>) {
  return (
    <div
      className={`cd-node ${selected ? "cd-node--selected" : ""}`}
      style={{ width: 60, height: 30 }}
      title="스위치: 클릭해서 열고 닫기"
    >
      <SwitchShape closed={data.on} className="h-full w-full" />
      <Handle
        type="target"
        position={Position.Left}
        id={inputPort(0)}
        className="cd-handle"
        style={{ top: "66.7%" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={OUTPUT_PORT}
        className="cd-handle"
        style={{ top: "66.7%" }}
      />
    </div>
  );
}

export default memo(SwitchNode);
