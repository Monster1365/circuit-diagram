"use client";

import { Handle, Position } from "@xyflow/react";
import { CATALOG, GRID } from "@/lib/circuit/catalog";
import { OUTPUT_PORT, inputPort, type ComponentKind } from "@/lib/circuit/types";

/** 부품 정의(catalog)에 맞춰 연결점을 격자선 위에 배치한다 (배율 반영) */
export default function Ports({ kind, scale = 1 }: { kind: ComponentKind; scale?: number }) {
  const spec = CATALOG[kind];
  return (
    <>
      {spec.inputYs.map((y, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Left}
          id={inputPort(i)}
          className="cd-handle"
          style={{ top: y * GRID * scale }}
        />
      ))}
      {spec.outputs > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id={OUTPUT_PORT}
          className="cd-handle"
          style={{ top: spec.outputY * GRID * scale }}
        />
      )}
    </>
  );
}
