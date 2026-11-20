"use client";

import { ViewportPortal } from "@xyflow/react";
import { componentSize } from "@/lib/circuit/catalog";
import { groupMembers, groupName } from "@/lib/circuit/groups";
import { useCircuitStore } from "@/store/circuitStore";

const PADDING = 12;
/** 부품 아래 이름표(LED 1 …)까지 감싸도록 아래쪽 여백을 조금 더 둔다 */
const BOTTOM_EXTRA = 12;

/** 그룹마다 소속 부품을 감싸는 점선 상자와 이름을 그린다 */
export default function GroupOutlines() {
  const nodes = useCircuitStore((s) => s.nodes);
  const groups = groupMembers(nodes);
  if (groups.size === 0) return null;

  return (
    <ViewportPortal>
      {[...groups].map(([groupId, members]) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of members) {
          const { width, height } = componentSize(n.data.kind, n.data.scale);
          minX = Math.min(minX, n.position.x);
          minY = Math.min(minY, n.position.y);
          maxX = Math.max(maxX, n.position.x + width);
          maxY = Math.max(maxY, n.position.y + height);
        }
        const selected = members.every((m) => m.selected);
        return (
          <div
            key={groupId}
            className={`cd-group ${selected ? "cd-group--selected" : ""}`}
            style={{
              transform: `translate(${minX - PADDING}px, ${minY - PADDING}px)`,
              width: maxX - minX + PADDING * 2,
              height: maxY - minY + PADDING * 2 + BOTTOM_EXTRA,
            }}
          >
            <span className="cd-group-label">{groupName(groupId)}</span>
          </div>
        );
      })}
    </ViewportPortal>
  );
}
