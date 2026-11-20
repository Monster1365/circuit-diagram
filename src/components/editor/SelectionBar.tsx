"use client";

import { Panel, useReactFlow } from "@xyflow/react";
import { useShallow } from "zustand/react/shallow";
import { MAX_SCALE, MIN_SCALE } from "@/lib/circuit/catalog";
import { useCircuitStore } from "@/store/circuitStore";

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

/** 부품을 선택하면 캔버스 위쪽에 나타나는 도구 모음: 크기, 그룹, 삭제 */
export default function SelectionBar() {
  const { allNodes, changeSelectedScale, toggleGroup } = useCircuitStore(
    useShallow((s) => ({
      allNodes: s.nodes,
      changeSelectedScale: s.changeSelectedScale,
      toggleGroup: s.toggleGroup,
    })),
  );
  const { deleteElements } = useReactFlow();
  const selected = allNodes.filter((n) => n.selected);
  if (selected.length === 0) return null;

  const scales = new Set(selected.map((n) => n.data.scale ?? 1));
  const minScale = Math.min(...scales);
  const maxScale = Math.max(...scales);

  const groupIds = new Set(selected.map((n) => n.data.groupId));
  const [onlyGroup] = groupIds;
  const isWholeGroup =
    groupIds.size === 1 &&
    !!onlyGroup &&
    allNodes.every((n) => n.data.groupId !== onlyGroup || n.selected);
  const shortcut = isMac() ? "⌘G" : "Ctrl+G";

  return (
    <Panel position="top-center">
      <div className="flex items-center gap-1 rounded-lg border border-cd-border bg-cd-bg px-2 py-1 text-xs shadow-sm">
        <span className="px-1 font-medium tabular-nums">{selected.length}개 선택</span>
        <span className="mx-1 h-4 w-px bg-cd-border" />

        <span className="text-cd-muted">크기</span>
        <button
          type="button"
          className="cd-bar-btn w-6"
          onClick={() => changeSelectedScale(-1)}
          disabled={maxScale <= MIN_SCALE}
          aria-label="크기 줄이기"
        >
          −
        </button>
        <span className="w-7 text-center tabular-nums">
          {scales.size === 1 ? `×${minScale}` : "여러"}
        </span>
        <button
          type="button"
          className="cd-bar-btn w-6"
          onClick={() => changeSelectedScale(1)}
          disabled={minScale >= MAX_SCALE}
          aria-label="크기 키우기"
        >
          +
        </button>
        <span className="mx-1 h-4 w-px bg-cd-border" />

        <button
          type="button"
          className="cd-bar-btn px-2"
          onClick={() => toggleGroup()}
          disabled={!isWholeGroup && selected.length < 2}
          title={`${isWholeGroup ? "그룹 풀기" : "그룹으로 묶기"} (${shortcut})`}
        >
          {isWholeGroup ? "그룹 풀기" : "그룹 묶기"}
          <kbd className="ml-1 text-[10px] text-cd-muted">{shortcut}</kbd>
        </button>
        <button
          type="button"
          className="cd-bar-btn px-2 text-cd-danger"
          onClick={() => deleteElements({ nodes: selected.map((n) => ({ id: n.id })) })}
          title="선택한 부품 삭제 (Delete)"
        >
          삭제
        </button>
      </div>
    </Panel>
  );
}
