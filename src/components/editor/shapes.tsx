import type { GateKind } from "@/lib/circuit/types";

/**
 * 게이트 기호 SVG. viewBox 0 0 80 50 기준.
 * 입력선은 y=15, y=35 (입력 1개면 y=25), 출력선은 y=25.
 * 노드와 도구상자 아이콘이 함께 사용한다.
 */
export const GATE_WIDTH = 80;
export const GATE_HEIGHT = 50;

const AND_BODY = "M15,5 H40 A20,20 0 0 1 40,45 H15 Z";
const OR_BODY = "M12,5 Q24,25 12,45 Q46,45 62,25 Q46,5 12,5 Z";
const XOR_EXTRA = "M5,5 Q17,25 5,45";
const NOT_BODY = "M15,7 L55,25 L15,43 Z";

type ShapeInfo = {
  body: string;
  extra?: string;
  /** 출력 쪽 반전 동그라미 중심 x */
  bubble?: number;
  /** 몸체 오른쪽 끝(출력선 시작) x */
  outX: number;
  /** 입력선이 몸체에 닿는 x */
  inX: number;
};

const SHAPES: Record<GateKind, ShapeInfo> = {
  AND: { body: AND_BODY, outX: 60, inX: 15 },
  NAND: { body: AND_BODY, bubble: 64, outX: 68, inX: 15 },
  OR: { body: OR_BODY, outX: 62, inX: 19 },
  NOR: { body: OR_BODY, bubble: 66, outX: 70, inX: 19 },
  XOR: { body: OR_BODY, extra: XOR_EXTRA, outX: 62, inX: 19 },
  XNOR: { body: OR_BODY, extra: XOR_EXTRA, bubble: 66, outX: 70, inX: 19 },
  NOT: { body: NOT_BODY, bubble: 59, outX: 63, inX: 15 },
};

type GateShapeProps = {
  kind: GateKind;
  /** 입력선 신호 (선 색 표시용) */
  inputs?: boolean[];
  output?: boolean;
  className?: string;
};

export function GateShape({ kind, inputs = [], output = false, className }: GateShapeProps) {
  const s = SHAPES[kind];
  const inputYs = kind === "NOT" ? [25] : [15, 35];
  const lead = (on: boolean | undefined) =>
    on ? "var(--cd-wire-on)" : "var(--cd-gate-stroke)";

  return (
    <svg
      viewBox={`0 0 ${GATE_WIDTH} ${GATE_HEIGHT}`}
      className={className}
      fill="none"
      strokeWidth={2}
      strokeLinejoin="round"
    >
      {inputYs.map((y, i) => (
        <line key={y} x1={0} y1={y} x2={s.inX} y2={y} stroke={lead(inputs[i])} />
      ))}
      <line x1={s.outX} y1={25} x2={GATE_WIDTH} y2={25} stroke={lead(output)} />
      <path d={s.body} fill="var(--cd-gate-fill)" stroke="var(--cd-gate-stroke)" />
      {s.extra && <path d={s.extra} stroke="var(--cd-gate-stroke)" />}
      {s.bubble !== undefined && (
        <circle
          cx={s.bubble}
          cy={25}
          r={4}
          fill="var(--cd-gate-fill)"
          stroke="var(--cd-gate-stroke)"
        />
      )}
    </svg>
  );
}

export function PowerShape({ on = true, className }: { on?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" strokeWidth={2.2} strokeLinecap="round">
      <path
        d="M7.5 6.5a7.5 7.5 0 1 0 9 0"
        stroke={on ? "var(--cd-wire-on)" : "var(--cd-muted)"}
      />
      <line x1={12} y1={3} x2={12} y2={12} stroke={on ? "var(--cd-wire-on)" : "var(--cd-muted)"} />
    </svg>
  );
}

export function SwitchShape({ closed = false, className }: { closed?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} fill="none" strokeWidth={2} strokeLinecap="round">
      <line x1={0} y1={20} x2={14} y2={20} stroke="var(--cd-gate-stroke)" />
      <line x1={46} y1={20} x2={60} y2={20} stroke="var(--cd-gate-stroke)" />
      <circle cx={16} cy={20} r={2.5} fill="var(--cd-gate-stroke)" />
      <circle cx={44} cy={20} r={2.5} fill="var(--cd-gate-stroke)" />
      <line
        x1={16}
        y1={20}
        x2={closed ? 44 : 40}
        y2={closed ? 20 : 6}
        stroke={closed ? "var(--cd-wire-on)" : "var(--cd-gate-stroke)"}
      />
    </svg>
  );
}

export function LedShape({ lit = false, className }: { lit?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <circle
        cx={12}
        cy={12}
        r={8}
        fill={lit ? "var(--cd-led-on)" : "var(--cd-led-off)"}
        stroke="var(--cd-gate-stroke)"
        strokeWidth={1.6}
      />
      {lit && <circle cx={9} cy={9} r={2.2} fill="white" opacity={0.7} />}
    </svg>
  );
}
