"use client";

import { Handle, Position, useNodeId } from "@xyflow/react";
import { CATALOG, GRID } from "@/lib/circuit/catalog";
import { portKey } from "@/lib/circuit/contacts";
import { OUTPUT_PORT, inputPort, type ComponentKind } from "@/lib/circuit/types";
import { useSimulation } from "../SimulationContext";

/** 부품 정의(catalog)에 맞춰 연결점을 격자선 위에 배치한다 (배율 반영) */
export default function Ports({ kind, scale = 1 }: { kind: ComponentKind; scale?: number }) {
  const spec = CATALOG[kind];
  const nodeId = useNodeId() ?? "";
  const { joinedPorts } = useSimulation();
  // 다른 부품의 연결점과 맞닿아 연결된 점은 채운 점으로 표시한다
  const cls = (handle: string) =>
    joinedPorts.has(portKey(nodeId, handle)) ? "cd-handle cd-handle--joined" : "cd-handle";
  return (
    <>
      {spec.inputYs.map((y, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Left}
          id={inputPort(i)}
          className={cls(inputPort(i))}
          style={{ top: y * GRID * scale }}
        />
      ))}
      {spec.outputs > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id={OUTPUT_PORT}
          className={cls(OUTPUT_PORT)}
          style={{ top: spec.outputY * GRID * scale }}
        />
      )}
    </>
  );
}
