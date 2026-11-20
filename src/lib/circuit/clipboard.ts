import type { Edge } from "@xyflow/react";
import type { CircuitNode } from "@/store/circuitStore";
import { LABEL_PREFIX } from "./catalog";
import { groupIdOf, nextGroupNumber } from "./groups";
import { nextLabelNumber } from "./labels";
import type { ComponentKind } from "./types";

/** 복사해 둔 부품과 그 부품끼리 이어진 선 */
export type ClipboardData = { nodes: CircuitNode[]; edges: Edge[] };

export const edgeId = (e: Pick<Edge, "source" | "sourceHandle" | "target" | "targetHandle">) =>
  `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`;

/** 선택된 부품을 복사한다. 양쪽 끝이 모두 복사되는 선만 함께 복사한다 */
export function copySelection(nodes: CircuitNode[], edges: Edge[]): ClipboardData | null {
  const selected = nodes.filter((n) => n.selected);
  if (selected.length === 0) return null;
  const ids = new Set(selected.map((n) => n.id));
  return {
    nodes: selected.map((n) => ({
      id: n.id,
      type: n.type,
      position: { ...n.position },
      data: { ...n.data },
    })),
    edges: edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({
        id: e.id,
        type: e.type,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
      })),
  };
}

/**
 * 복사본을 만든다. 새 id·이름(AND 2 …)·그룹 번호를 붙이고 offset만큼 비켜 놓는다.
 * 만들어진 부품과 선은 선택된 상태로 돌려준다.
 */
export function pasteClipboard(
  existing: CircuitNode[],
  clip: ClipboardData,
  offset: number,
  makeId: (kind: ComponentKind) => string,
): ClipboardData {
  const idMap = new Map<string, string>();
  const groupMap = new Map<string, string>();
  const labelNumbers = new Map<ComponentKind, number>();
  let groupNumber = nextGroupNumber(existing);

  const nodes = clip.nodes.map((n): CircuitNode => {
    const kind = n.data.kind;
    const id = makeId(kind);
    idMap.set(n.id, id);

    const prefix = LABEL_PREFIX[kind];
    const num = labelNumbers.get(kind) ?? nextLabelNumber(existing, kind, prefix);
    labelNumbers.set(kind, num + 1);

    let groupId: string | undefined;
    if (n.data.groupId) {
      if (!groupMap.has(n.data.groupId)) groupMap.set(n.data.groupId, groupIdOf(groupNumber++));
      groupId = groupMap.get(n.data.groupId);
    }

    return {
      id,
      type: n.type,
      position: { x: n.position.x + offset, y: n.position.y + offset },
      data: { ...n.data, label: `${prefix} ${num}`, groupId },
      selected: true,
    };
  });

  const edges = clip.edges.map((e): Edge => {
    const copy = {
      source: idMap.get(e.source)!,
      sourceHandle: e.sourceHandle,
      target: idMap.get(e.target)!,
      targetHandle: e.targetHandle,
    };
    return { ...copy, id: edgeId(copy), type: e.type, selected: true };
  });

  return { nodes, edges };
}
