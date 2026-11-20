"use client";

import type { NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { CircuitNode } from "@/store/circuitStore";
import { SwitchShape } from "../shapes";
import Ports, { nodeSize } from "./Ports";
import { useInputSignals } from "./useInputSignals";

function SwitchNode({ data, selected }: NodeProps<CircuitNode>) {
  const [input] = useInputSignals("SWITCH");
  return (
    <div
      className={`cd-node cd-clickable ${selected ? "cd-node--selected" : ""}`}
      style={nodeSize("SWITCH")}
      title={`스위치 ${data.on ? "닫힘" : "열림"}: 클릭해서 열고 닫기`}
    >
      <SwitchShape closed={data.on} input={input} className="h-full w-full" />
      <Ports kind="SWITCH" />
    </div>
  );
}

export default memo(SwitchNode);
