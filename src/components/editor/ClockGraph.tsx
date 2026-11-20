"use client";

import { useClockStore } from "@/store/clockStore";

const W = 240;
const H = 36;
const HIGH_Y = 5;
const LOW_Y = H - 5;

type ClockGraphProps = {
  id: string;
  period: number;
  /** 현재 시각 (performance.now 기준) */
  now: number;
};

/** 클럭 신호의 최근 파형. 주기 6개 분량을 보여준다. */
export default function ClockGraph({ id, period, now }: ClockGraphProps) {
  const samples = useClockStore((s) => s.history[id]);
  const windowMs = period * 6;
  const from = now - windowMs;
  const x = (t: number) => ((Math.max(t, from) - from) / windowMs) * W;
  const y = (level: boolean) => (level ? HIGH_Y : LOW_Y);

  let path = "";
  if (samples?.length && now > 0) {
    // 화면 왼쪽 끝 이전의 마지막 레벨부터 시작
    let i = samples.findIndex((s) => s.t > from);
    if (i === -1) i = samples.length;
    const startIndex = Math.max(i - 1, 0);
    let level = samples[startIndex].level;
    path = `M${x(samples[startIndex].t)},${y(level)}`;
    for (let k = startIndex + 1; k < samples.length; k++) {
      const sx = x(samples[k].t);
      level = samples[k].level;
      path += ` H${sx} V${y(level)}`;
    }
    path += ` H${W}`;
  }

  return (
    <div className="flex items-stretch gap-1.5">
      <div className="flex flex-col justify-between py-0.5 text-[9px] leading-none text-cd-muted">
        <span>1</span>
        <span>0</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-9 min-w-0 flex-1 rounded border border-cd-border bg-cd-bg"
      >
        {/* 주기마다 세로 보조선 */}
        {Array.from({ length: 5 }, (_, k) => (
          <line
            key={k}
            x1={((k + 1) * W) / 6}
            x2={((k + 1) * W) / 6}
            y1={0}
            y2={H}
            stroke="var(--cd-grid)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {path && (
          <path
            d={path}
            fill="none"
            stroke="var(--cd-wire-on)"
            strokeWidth={1.8}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}
