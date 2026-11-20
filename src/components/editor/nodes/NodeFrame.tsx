"use client";

import { useNodeId, useUpdateNodeInternals } from "@xyflow/react";
import { useEffect, type PointerEvent, type ReactNode } from "react";
import { SHOW_LABEL_ON_CANVAS, componentSize } from "@/lib/circuit/catalog";
import type { CircuitNodeData } from "@/lib/circuit/types";
import { useCircuitStore } from "@/store/circuitStore";
import Ports from "./Ports";

type NodeFrameProps = {
  data: CircuitNodeData;
  selected: boolean;
  /** 바깥 틀(선택 외곽선 모양 등)에 붙일 클래스 */
  className?: string;
  /** 기본 크기로 그려지는 안쪽 내용에 붙일 클래스 */
  innerClassName?: string;
  title?: string;
  children: ReactNode;
};

/**
 * 모든 부품의 공통 틀.
 * 안쪽 내용은 기본 크기로 그린 뒤 배율만큼 확대하고,
 * 연결점은 바깥 틀에 배율을 반영한 격자 위치로 놓아 크기와 상관없이 같은 모양을 유지한다.
 */
export default function NodeFrame({
  data,
  selected,
  className = "",
  innerClassName = "",
  title,
  children,
}: NodeFrameProps) {
  const id = useNodeId();
  const updateNodeInternals = useUpdateNodeInternals();
  const selectNodes = useCircuitStore((s) => s.selectNodes);
  const scale = data.scale ?? 1;
  const base = componentSize(data.kind);
  const scaled = componentSize(data.kind, scale);

  // 크기가 바뀌면 React Flow가 연결점 위치를 다시 측정하도록 알린다
  useEffect(() => {
    if (id) updateNodeInternals(id);
  }, [id, scale, updateNodeInternals]);

  // 선택되지 않은 그룹 부품을 누르면 끌기가 시작되기 전에 그룹 전체를 먼저 선택한다.
  // (그래야 바로 끌어도 그룹이 함께 움직인다)
  const onPointerDownCapture = (event: PointerEvent) => {
    if (!id || !data.groupPath?.length || selected || event.button !== 0) return;
    if (event.shiftKey || event.metaKey || event.ctrlKey) return;
    if ((event.target as Element).closest(".react-flow__handle")) return;
    selectNodes([id]);
  };

  return (
    <div
      className={`cd-node ${selected ? "cd-node--selected" : ""} ${className}`}
      style={scaled}
      title={title}
      onPointerDownCapture={onPointerDownCapture}
    >
      <div
        className={innerClassName}
        style={{
          ...base,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
      <Ports kind={data.kind} scale={scale} />
      {data.label && SHOW_LABEL_ON_CANVAS.includes(data.kind) && (
        <span className="cd-node-label">{data.label}</span>
      )}
    </div>
  );
}
