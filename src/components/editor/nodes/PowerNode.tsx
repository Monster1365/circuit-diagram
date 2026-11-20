"use client";

import type { NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { CircuitNode } from "@/store/circuitStore";
import { PowerShape } from "../shapes";
import NodeFrame from "./NodeFrame";

function PowerNode({ data, selected }: NodeProps<CircuitNode>) {
  return (
    <NodeFrame
      data={data}
      selected={selected}
      className="cd-node--round cd-clickable"
      title={`${data.label ?? "전원"} ${data.on ? "켜짐" : "꺼짐"}: 클릭해서 켜고 끄기`}
    >
      <PowerShape on={data.on} className="h-full w-full" />
    </NodeFrame>
  );
}

export default memo(PowerNode);
