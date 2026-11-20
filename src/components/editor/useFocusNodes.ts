"use client";

import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { componentSize } from "@/lib/circuit/catalog";
import { useCircuitStore, type CircuitNode } from "@/store/circuitStore";

/** 부품(들)을 선택하고 캔버스를 그 위치로 옮긴다 */
export function useFocusNodes() {
  const { setCenter, getZoom, fitView } = useReactFlow();
  const selectNodes = useCircuitStore((s) => s.selectNodes);

  return useCallback(
    (targets: CircuitNode[]) => {
      if (targets.length === 0) return;
      selectNodes(targets.map((n) => n.id));
      const zoom = Math.max(getZoom(), 1);
      if (targets.length === 1) {
        const [n] = targets;
        const { width, height } = componentSize(n.data.kind, n.data.scale);
        setCenter(n.position.x + width / 2, n.position.y + height / 2, {
          zoom,
          duration: 300,
        });
      } else {
        fitView({
          nodes: targets.map((n) => ({ id: n.id })),
          padding: 0.3,
          maxZoom: zoom,
          duration: 300,
        });
      }
    },
    [fitView, getZoom, selectNodes, setCenter],
  );
}
