"use client";

import { Handle, Position, useNodeConnections, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { CATALOG } from "@/lib/circuit/catalog";
import { OUTPUT_PORT, inputPort, type GateKind } from "@/lib/circuit/types";
import type { CircuitNode } from "@/store/circuitStore";
import { useSignalsOf } from "../SimulationContext";
import { GATE_HEIGHT, GATE_WIDTH, GateShape } from "../shapes";

function GateNode({ id, data, selected }: NodeProps<CircuitNode>) {
  const kind = data.kind as GateKind;
  const inputCount = CATALOG[kind].inputs;
  const tops = inputCount === 1 ? ["50%"] : ["30%", "70%"];

  // 입력선 색 표시를 위해 각 입력 포트에 연결된 출력 노드의 신호를 가져온다
  const connections = useNodeConnections({ handleType: "target" });
  const drivers = tops.map(
    (_, i) => connections.find((c) => c.targetHandle === inputPort(i))?.source,
  );
  const [output, ...inputs] = useSignalsOf([id, ...drivers]);

  return (
    <div
      className={`cd-node ${selected ? "cd-node--selected" : ""}`}
      style={{ width: GATE_WIDTH, height: GATE_HEIGHT }}
      title={`${kind}: ${CATALOG[kind].description}`}
    >
      <GateShape kind={kind} inputs={inputs} output={output} className="h-full w-full" />
      {tops.map((top, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Left}
          id={inputPort(i)}
          className="cd-handle"
          style={{ top }}
        />
      ))}
      <Handle type="source" position={Position.Right} id={OUTPUT_PORT} className="cd-handle" />
    </div>
  );
}

export default memo(GateNode);
