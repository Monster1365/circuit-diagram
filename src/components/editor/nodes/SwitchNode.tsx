"use client";

import type { NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { CircuitNode } from "@/store/circuitStore";
import { SwitchShape } from "../shapes";
import NodeFrame from "./NodeFrame";
import { useInputSignals } from "./useInputSignals";

function SwitchNode({ data, selected }: NodeProps<CircuitNode>) {
  const [input] = useInputSignals("SWITCH");
  return (
    <NodeFrame
      data={data}
      selected={selected}
      className="cd-clickable"
      title={`${data.label ?? "스위치"} ${data.on ? "닫힘" : "열림"}: 클릭해서 열고 닫기`}
    >
      <SwitchShape closed={data.on} input={input} className="h-full w-full" />
    </NodeFrame>
  );
}

export default memo(SwitchNode);
