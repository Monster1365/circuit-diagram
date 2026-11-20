"use client";

import type { NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { CircuitNode } from "@/store/circuitStore";
import { PowerShape } from "../shapes";
import Ports, { nodeSize } from "./Ports";

function PowerNode({ data, selected }: NodeProps<CircuitNode>) {
  return (
    <div
      className={`cd-node cd-node--round cd-clickable ${selected ? "cd-node--selected" : ""}`}
      style={nodeSize("POWER")}
      title={`전원 ${data.on ? "켜짐" : "꺼짐"}: 클릭해서 켜고 끄기`}
    >
      <PowerShape on={data.on} className="h-full w-full" />
      <Ports kind="POWER" />
    </div>
  );
}

export default memo(PowerNode);
