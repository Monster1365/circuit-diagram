"use client";

import type { NodeProps } from "@xyflow/react";
import { memo } from "react";
import { CATALOG } from "@/lib/circuit/catalog";
import type { GateKind } from "@/lib/circuit/types";
import type { CircuitNode } from "@/store/circuitStore";
import { useSignal } from "../SimulationContext";
import { GateShape } from "../shapes";
import Ports, { nodeSize } from "./Ports";
import { useInputSignals } from "./useInputSignals";

function GateNode({ id, data, selected }: NodeProps<CircuitNode>) {
  const kind = data.kind as GateKind;
  const output = useSignal(id);
  const inputs = useInputSignals(kind);

  return (
    <div
      className={`cd-node ${selected ? "cd-node--selected" : ""}`}
      style={nodeSize(kind)}
      title={`${kind}: ${CATALOG[kind].description}`}
    >
      <GateShape kind={kind} inputs={inputs} output={output} className="h-full w-full" />
      <Ports kind={kind} />
    </div>
  );
}

export default memo(GateNode);
