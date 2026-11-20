"use client";

import type { KeyboardEvent, PointerEvent } from "react";

export const PANEL_MIN_WIDTH = 180;
export const PANEL_MAX_WIDTH = 420;

const clamp = (w: number) => Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, w));

type ResizeHandleProps = {
  /** 패널의 어느 쪽 가장자리에 붙는지 */
  edge: "left" | "right";
  width: number;
  onResize: (width: number) => void;
  label: string;
};

/** 패널 가장자리를 끌어 넓이를 바꾸는 손잡이 (최소·최대 넓이 제한) */
export default function ResizeHandle({ edge, width, onResize, label }: ResizeHandleProps) {
  // 오른쪽 가장자리는 오른쪽으로 끌면 넓어지고, 왼쪽 가장자리는 왼쪽으로 끌면 넓어진다
  const direction = edge === "right" ? 1 : -1;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    document.body.classList.add("cd-resizing");

    const onMove = (e: globalThis.PointerEvent) =>
      onResize(clamp(startWidth + (e.clientX - startX) * direction));
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      document.body.classList.remove("cd-resizing");
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp, { once: true });
    target.addEventListener("pointercancel", onUp, { once: true });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 40 : 10;
    if (event.key === "ArrowRight") onResize(clamp(width + step * direction));
    else if (event.key === "ArrowLeft") onResize(clamp(width - step * direction));
    else return;
    event.preventDefault();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={PANEL_MIN_WIDTH}
      aria-valuemax={PANEL_MAX_WIDTH}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className="cd-resize-handle"
      style={{ [edge]: -3 }}
    />
  );
}
