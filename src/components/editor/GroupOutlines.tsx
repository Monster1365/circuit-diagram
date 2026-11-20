"use client";

import { ViewportPortal } from "@xyflow/react";
import type { ReactNode } from "react";
import { SHOW_LABEL_ON_CANVAS, componentSize } from "@/lib/circuit/catalog";
import { buildGroupTree, groupName, membersOf, type GroupTreeItem } from "@/lib/circuit/groups";
import { useCircuitStore, type CircuitNode } from "@/store/circuitStore";

/** 그룹 상자와 안쪽 내용 사이 여백. 그룹 안의 그룹은 이만큼씩 더 안쪽에 그려진다 */
const PADDING = 18;
/** 부품 아래 이름표(LED 1 …) 높이 */
const LABEL_SPACE = 14;

type Box = { x1: number; y1: number; x2: number; y2: number };

/** 그룹마다 소속 부품을 감싸는 점선 상자와 이름을 그린다 (그룹 안의 그룹도 각각) */
export default function GroupOutlines() {
  const nodes = useCircuitStore((s) => s.nodes);
  const tree = buildGroupTree(nodes);
  if (!tree.some((item) => item.type === "group")) return null;

  const outlines: ReactNode[] = [];

  // 항목이 차지하는 영역을 계산하면서, 그룹이면 외곽선을 하나 추가한다
  const measure = (item: GroupTreeItem<CircuitNode>): Box => {
    if (item.type === "node") {
      const n = item.node;
      const { width, height } = componentSize(n.data.kind, n.data.scale);
      const label = SHOW_LABEL_ON_CANVAS.includes(n.data.kind) ? LABEL_SPACE : 0;
      return { x1: n.position.x, y1: n.position.y, x2: n.position.x + width, y2: n.position.y + height + label };
    }
    const inner = item.items.map(measure);
    const box = {
      x1: Math.min(...inner.map((b) => b.x1)) - PADDING,
      y1: Math.min(...inner.map((b) => b.y1)) - PADDING,
      x2: Math.max(...inner.map((b) => b.x2)) + PADDING,
      y2: Math.max(...inner.map((b) => b.y2)) + PADDING,
    };
    const selected = membersOf(item).every((m) => m.selected);
    outlines.push(
      <div
        key={item.id}
        className={`cd-group ${selected ? "cd-group--selected" : ""}`}
        style={{
          transform: `translate(${box.x1}px, ${box.y1}px)`,
          width: box.x2 - box.x1,
          height: box.y2 - box.y1,
        }}
      >
        <span className="cd-group-label">{groupName(item.id)}</span>
      </div>,
    );
    return box;
  };
  tree.forEach(measure);

  return <ViewportPortal>{outlines}</ViewportPortal>;
}
