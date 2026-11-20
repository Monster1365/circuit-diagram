"use client";

import type { NodeProps } from "@xyflow/react";
import { memo, type MouseEvent } from "react";
import { CLOCK_PERIODS, DEFAULT_CLOCK_PERIOD, formatPeriod } from "@/lib/circuit/catalog";
import { useCircuitStore, type CircuitNode } from "@/store/circuitStore";
import { useSignal } from "../SimulationContext";
import { ClockShape } from "../shapes";
import Ports, { nodeSize } from "./Ports";

function ClockNode({ id, data, selected }: NodeProps<CircuitNode>) {
  const level = useSignal(id);
  const setClockPeriod = useCircuitStore((s) => s.setClockPeriod);
  const period = data.period ?? DEFAULT_CLOCK_PERIOD;
  const index = CLOCK_PERIODS.indexOf(period);

  const step = (delta: number) => (event: MouseEvent) => {
    event.stopPropagation();
    const next = CLOCK_PERIODS[index + delta];
    if (next !== undefined) setClockPeriod(id, next);
  };

  return (
    <div
      className={`cd-node cd-clock ${level ? "cd-clock--high" : ""} ${selected ? "cd-node--selected" : ""}`}
      style={nodeSize("CLOCK")}
      title={`${data.label ?? "클럭"}: 주기 ${formatPeriod(period)}`}
    >
      <button
        type="button"
        className="cd-clock-btn nodrag"
        onClick={step(-1)}
        disabled={index <= 0}
        aria-label="주기 줄이기"
      >
        −
      </button>
      <div className="flex flex-col items-center leading-none">
        <ClockShape
          className="h-3 w-5"
          color={level ? "var(--cd-wire-on)" : "var(--cd-gate-stroke)"}
        />
        <span className="mt-0.5 text-[10px] font-semibold tabular-nums">
          {formatPeriod(period)}
        </span>
      </div>
      <button
        type="button"
        className="cd-clock-btn nodrag"
        onClick={step(1)}
        disabled={index < 0 || index >= CLOCK_PERIODS.length - 1}
        aria-label="주기 늘리기"
      >
        +
      </button>
      <Ports kind="CLOCK" />
      {data.label && <span className="cd-node-label">{data.label}</span>}
    </div>
  );
}

export default memo(ClockNode);
