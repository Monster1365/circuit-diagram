"use client";

import type { DragEvent } from "react";
import { CATALOG, GATE_KINDS, IO_KINDS } from "@/lib/circuit/catalog";
import type { ComponentKind, GateKind } from "@/lib/circuit/types";
import { GateShape, LedShape, PowerShape, SwitchShape } from "./shapes";

export const DRAG_MIME = "application/x-cd-component";

function Icon({ kind }: { kind: ComponentKind }) {
  switch (kind) {
    case "POWER":
      return <PowerShape className="h-6 w-6" />;
    case "SWITCH":
      return <SwitchShape closed className="h-5 w-10" />;
    case "LED":
      return <LedShape lit className="h-6 w-6" />;
    default:
      return <GateShape kind={kind as GateKind} className="h-6 w-10" />;
  }
}

type ToolboxProps = {
  /** 클릭으로 추가할 때 호출 (화면 중앙에 배치) */
  onAdd: (kind: ComponentKind) => void;
};

export default function Toolbox({ onAdd }: ToolboxProps) {
  const onDragStart = (event: DragEvent, kind: ComponentKind) => {
    event.dataTransfer.setData(DRAG_MIME, kind);
    event.dataTransfer.effectAllowed = "move";
  };

  const section = (title: string, kinds: ComponentKind[]) => (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-cd-muted">
        {title}
      </h2>
      <ul className="grid grid-cols-2 gap-2">
        {kinds.map((kind) => (
          <li key={kind}>
            <button
              type="button"
              draggable
              onDragStart={(e) => onDragStart(e, kind)}
              onClick={() => onAdd(kind)}
              title={`${CATALOG[kind].label}: ${CATALOG[kind].description}\n클릭하거나 캔버스로 끌어다 놓으세요.`}
              className="flex h-16 w-full cursor-grab flex-col items-center justify-center gap-1 rounded-lg border border-cd-border bg-cd-bg text-xs font-medium transition-colors hover:border-cd-accent hover:bg-cd-panel-hover active:cursor-grabbing"
            >
              <Icon kind={kind} />
              {CATALOG[kind].label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <aside className="flex w-52 shrink-0 flex-col gap-5 overflow-y-auto border-r border-cd-border bg-cd-panel p-3">
      {section("입출력", IO_KINDS)}
      {section("논리 게이트", GATE_KINDS)}
      <p className="mt-auto px-1 text-[11px] leading-relaxed text-cd-muted">
        연결점(●)을 끌어 선을 잇습니다. 선택한 부품·선은 Delete 키로 지웁니다.
      </p>
    </aside>
  );
}
