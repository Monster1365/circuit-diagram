"use client";

import type { DragEvent } from "react";
import { CATALOG, GATE_KINDS, IO_KINDS } from "@/lib/circuit/catalog";
import { groupMembers, groupName } from "@/lib/circuit/groups";
import type { ComponentKind, GateKind } from "@/lib/circuit/types";
import { useCircuitStore, type CircuitNode } from "@/store/circuitStore";
import ResizeHandle from "./ResizeHandle";
import { ClockShape, GateShape, LedShape, PowerShape, SwitchShape } from "./shapes";
import { useFocusNodes } from "./useFocusNodes";

export const DRAG_MIME = "application/x-cd-component";

function Icon({ kind, size = "md" }: { kind: ComponentKind; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-4" : "h-6";
  switch (kind) {
    case "POWER":
      return <PowerShape className={`${s} aspect-square`} />;
    case "CLOCK":
      return <ClockShape className={`${size === "sm" ? "h-3" : "h-4"} aspect-[3/2]`} />;
    case "SWITCH":
      return <SwitchShape closed className={`${s} aspect-[3/2]`} />;
    case "LED":
      return <LedShape lit className={`${s} aspect-square`} />;
    case "NOT":
      return <GateShape kind="NOT" className={`${size === "sm" ? "h-2.5" : "h-4"} aspect-[2/1]`} />;
    default:
      return <GateShape kind={kind as GateKind} className={`${s} aspect-square`} />;
  }
}

type ToolboxProps = {
  width: number;
  onResize: (width: number) => void;
  /** 클릭으로 추가할 때 호출 (화면 중앙에 배치) */
  onAdd: (kind: ComponentKind) => void;
};

export default function Toolbox({ width, onResize, onAdd }: ToolboxProps) {
  return (
    <aside
      className="relative flex shrink-0 flex-col border-r border-cd-border bg-cd-panel"
      style={{ width }}
    >
      <div className="shrink-0 space-y-3 border-b border-cd-border p-3">
        <PartGrid title="입출력" kinds={IO_KINDS} onAdd={onAdd} />
        <PartGrid title="논리 게이트" kinds={GATE_KINDS} onAdd={onAdd} />
      </div>
      <PlacedList />
      <ResizeHandle edge="right" width={width} onResize={onResize} label="도구상자 넓이" />
    </aside>
  );
}

function PartGrid({
  title,
  kinds,
  onAdd,
}: {
  title: string;
  kinds: ComponentKind[];
  onAdd: (kind: ComponentKind) => void;
}) {
  const onDragStart = (event: DragEvent, kind: ComponentKind) => {
    event.dataTransfer.setData(DRAG_MIME, kind);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <section>
      <h2 className="mb-1.5 px-0.5 text-[11px] font-semibold tracking-wide text-cd-muted">
        {title}
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1.5">
        {kinds.map((kind) => (
          <li key={kind}>
            <button
              type="button"
              draggable
              onDragStart={(e) => onDragStart(e, kind)}
              onClick={() => onAdd(kind)}
              title={`${CATALOG[kind].label}: ${CATALOG[kind].description}\n클릭하거나 캔버스로 끌어다 놓으세요.`}
              className="flex h-12 w-full cursor-grab flex-col items-center justify-center gap-0.5 rounded-md border border-cd-border bg-cd-bg text-[11px] font-medium transition-colors hover:border-cd-accent hover:bg-cd-panel-hover active:cursor-grabbing"
            >
              <span className="flex h-6 items-center">
                <Icon kind={kind} />
              </span>
              {CATALOG[kind].label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 캔버스에 놓인 부품 목록. 그룹은 묶어서 보여준다. 누르면 선택 후 그 위치로 이동 */
function PlacedList() {
  const nodes = useCircuitStore((s) => s.nodes);
  const focus = useFocusNodes();
  const groups = groupMembers(nodes);
  const ungrouped = nodes.filter((n) => !n.data.groupId);

  return (
    <section className="flex min-h-0 flex-1 flex-col p-3">
      <h2 className="mb-1.5 flex justify-between px-0.5 text-[11px] font-semibold tracking-wide text-cd-muted">
        <span>배치된 부품</span>
        <span className="tabular-nums">{nodes.length}</span>
      </h2>
      {nodes.length === 0 ? (
        <p className="px-0.5 text-xs leading-relaxed text-cd-muted">
          캔버스가 비어 있습니다. 위에서 부품을 끌어다 놓거나 클릭하세요.
        </p>
      ) : (
        <ul className="-mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1">
          {[...groups].map(([groupId, members]) => (
            <li key={groupId}>
              <button
                type="button"
                onClick={() => focus(members)}
                className={`cd-list-item font-semibold ${members.every((m) => m.selected) ? "cd-list-item--selected" : ""}`}
              >
                <span className="text-cd-muted">▾</span>
                {groupName(groupId)}
                <span className="ml-auto text-[10px] font-normal text-cd-muted">
                  {members.length}개
                </span>
              </button>
              <ul className="ml-3 space-y-0.5 border-l border-cd-border pl-1.5">
                {members.map((n) => (
                  <PlacedItem key={n.id} node={n} onClick={() => focus([n])} />
                ))}
              </ul>
            </li>
          ))}
          {ungrouped.map((n) => (
            <PlacedItem key={n.id} node={n} onClick={() => focus([n])} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PlacedItem({ node, onClick }: { node: CircuitNode; onClick: () => void }) {
  const scale = node.data.scale ?? 1;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`cd-list-item ${node.selected ? "cd-list-item--selected" : ""}`}
      >
        <span className="flex w-6 shrink-0 justify-center">
          <Icon kind={node.data.kind} size="sm" />
        </span>
        <span className="truncate">{node.data.label ?? CATALOG[node.data.kind].label}</span>
        {scale !== 1 && (
          <span className="ml-auto text-[10px] tabular-nums text-cd-muted">×{scale}</span>
        )}
      </button>
    </li>
  );
}
