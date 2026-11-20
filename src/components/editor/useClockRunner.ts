"use client";

import { useEffect } from "react";
import { DEFAULT_CLOCK_PERIOD } from "@/lib/circuit/catalog";
import type { CircuitNode } from "@/store/circuitStore";
import { useClockStore } from "@/store/clockStore";

/**
 * 캔버스의 클럭마다 타이머를 돌려 주기의 절반마다 레벨을 뒤집는다.
 * 모두 브라우저에서 실행된다. 클럭이 추가·삭제되거나 주기가 바뀌면 타이머를 다시 만든다.
 */
export function useClockRunner(nodes: CircuitNode[]) {
  const clockKey = nodes
    .filter((n) => n.data.kind === "CLOCK")
    .map((n) => `${n.id}=${n.data.period ?? DEFAULT_CLOCK_PERIOD}`)
    .join(",");

  useEffect(() => {
    const clocks = clockKey
      ? clockKey.split(",").map((entry) => {
          const [id, period] = entry.split("=");
          return { id, period: Number(period) };
        })
      : [];
    const { start, flip, prune } = useClockStore.getState();
    prune(new Set(clocks.map((c) => c.id)));

    const timers = clocks.map(({ id, period }) => {
      start(id, performance.now());
      return window.setInterval(() => flip(id, performance.now()), period / 2);
    });
    return () => timers.forEach((t) => window.clearInterval(t));
  }, [clockKey]);
}
