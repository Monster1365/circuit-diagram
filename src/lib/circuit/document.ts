import type { Edge } from "@xyflow/react";
import { CATALOG } from "./catalog";
import type { CircuitDocument } from "./types";
import type { CircuitNode } from "@/store/circuitStore";

/** 캔버스 상태 → 저장용 문서 (내보내기/DB 저장 시 사용 예정) */
export function toDocument(
  nodes: CircuitNode[],
  edges: Edge[],
): CircuitDocument {
  return {
    format: "cd",
    version: 1,
    nodes: nodes.map((n) => ({
      id: n.id,
      kind: n.data.kind,
      position: { x: n.position.x, y: n.position.y },
      on: n.data.on,
      ...(n.data.label !== undefined && { label: n.data.label }),
      ...(n.data.period !== undefined && { period: n.data.period }),
      ...(n.data.scale !== undefined && n.data.scale !== 1 && { scale: n.data.scale }),
      ...(n.data.groupPath?.length && { groupPath: [...n.data.groupPath] }),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourcePort: e.sourceHandle ?? "out",
      target: e.target,
      targetPort: e.targetHandle ?? "in0",
    })),
  };
}

/** 저장용 문서 → 캔버스 상태 (불러오기 시 사용 예정) */
export function fromDocument(doc: CircuitDocument): {
  nodes: CircuitNode[];
  edges: Edge[];
} {
  return {
    nodes: doc.nodes.map((n) => ({
      id: n.id,
      type: CATALOG[n.kind].nodeType,
      position: n.position,
      data: {
        kind: n.kind,
        on: n.on,
        label: n.label,
        period: n.period,
        scale: n.scale,
        groupPath: n.groupPath,
      },
    })),
    edges: doc.edges.map((e) => ({
      id: e.id,
      type: "wire",
      source: e.source,
      sourceHandle: e.sourcePort,
      target: e.target,
      targetHandle: e.targetPort,
    })),
  };
}
