"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CLOCK_PERIOD, formatPeriod } from "@/lib/circuit/catalog";
import { useCircuitStore } from "@/store/circuitStore";
import ClockGraph from "./ClockGraph";
import ResizeHandle from "./ResizeHandle";
import { useSimulation } from "./SimulationContext";
import { useFocusNodes } from "./useFocusNodes";

/** 오른쪽 로그 섹션: 위에는 켜진 LED, 아래에는 클럭 파형 */
type LogPanelProps = {
  width: number;
  onResize: (width: number) => void;
  onClose: () => void;
};

export default function LogPanel({ width, onResize, onClose }: LogPanelProps) {
  const nodes = useCircuitStore((s) => s.nodes);
  const { outputs } = useSimulation();
  const focusNodes = useFocusNodes();

  const leds = nodes.filter((n) => n.data.kind === "LED");
  const litLeds = leds.filter((n) => outputs[n.id]);
  const clocks = nodes.filter((n) => n.data.kind === "CLOCK");

  // 그래프를 흘려보내기 위한 현재 시각 (패널이 열려 있을 때만 갱신)
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (clocks.length === 0) return;
    const timer = window.setInterval(() => setNow(performance.now()), 50);
    return () => window.clearInterval(timer);
  }, [clocks.length]);

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l border-cd-border bg-cd-panel"
      style={{ width }}
    >
      <ResizeHandle edge="left" width={width} onResize={onResize} label="로그 넓이" />
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-cd-border px-3">
        <h2 className="text-sm font-semibold">로그</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-1.5 text-cd-muted hover:bg-cd-panel-hover hover:text-cd-text"
          aria-label="로그 닫기"
        >
          ✕
        </button>
      </div>

      <section className="flex min-h-0 flex-1 flex-col border-b border-cd-border p-3">
        <h3 className="mb-2 flex items-baseline justify-between text-xs font-semibold text-cd-muted">
          <span>켜진 LED</span>
          <span className="tabular-nums">
            {litLeds.length} / {leds.length}
          </span>
        </h3>
        {litLeds.length === 0 ? (
          <p className="text-xs text-cd-muted">
            {leds.length === 0 ? "캔버스에 LED가 없습니다." : "켜진 LED가 없습니다."}
          </p>
        ) : (
          <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
            {litLeds.map((led) => (
              <li key={led.id}>
                <button
                  type="button"
                  onClick={() => focusNodes([led])}
                  title="캔버스에서 위치 보기"
                  className="flex w-full items-center gap-2 rounded-md border border-cd-border bg-cd-bg px-2 py-1.5 text-left text-sm hover:border-cd-accent"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--cd-led-on)] shadow-[0_0_6px_var(--cd-led-on)]" />
                  {led.data.label ?? "LED"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex min-h-0 flex-1 flex-col p-3">
        <h3 className="mb-2 text-xs font-semibold text-cd-muted">클럭 신호</h3>
        {clocks.length === 0 ? (
          <p className="text-xs text-cd-muted">캔버스에 클럭이 없습니다.</p>
        ) : (
          <ul className="flex min-h-0 flex-col gap-3 overflow-y-auto">
            {clocks.map((clock) => {
              const period = clock.data.period ?? DEFAULT_CLOCK_PERIOD;
              return (
                <li key={clock.id}>
                  <button
                    type="button"
                    onClick={() => focusNodes([clock])}
                    title="캔버스에서 위치 보기"
                    className="mb-1 flex w-full items-baseline justify-between text-xs hover:text-cd-accent"
                  >
                    <span className="font-medium">{clock.data.label ?? "클럭"}</span>
                    <span className="tabular-nums text-cd-muted">
                      주기 {formatPeriod(period)} · 최근 {formatPeriod(period * 6)}
                    </span>
                  </button>
                  <ClockGraph id={clock.id} period={period} now={now} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}
