"use client";

import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import { memo } from "react";
import { useSignal } from "../SimulationContext";

/** 회로 선. 신호가 1이면 강조색, 0이면 회색 */
function WireEdge({
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const on = useSignal(source);
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 6,
  });

  return (
    <BaseEdge
      path={path}
      interactionWidth={14}
      style={{
        stroke: on ? "var(--cd-wire-on)" : "var(--cd-wire-off)",
        strokeWidth: selected ? 3.5 : 2.5,
        filter: selected ? "drop-shadow(0 0 3px var(--cd-accent))" : undefined,
      }}
    />
  );
}

export default memo(WireEdge);
