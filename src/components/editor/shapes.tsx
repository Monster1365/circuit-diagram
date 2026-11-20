import type { GateKind } from "@/lib/circuit/types";

/*
 * 부품 기호 SVG. 크기는 모두 격자 한 칸(20px)의 배수이고,
 * 입출력선은 격자선(20의 배수) 높이에 그려서 선이 일자로 이어지게 한다.
 * 노드와 도구상자 아이콘이 함께 사용한다.
 *
 * - 2입력 게이트: 80×80, 입력 y=20·60, 출력 y=40
 * - NOT:          80×40, 입력·출력 y=20
 * - 전원·LED:     40×40, 연결점 y=20
 * - 스위치:       60×40, 연결점 y=20
 * - 클럭:         100×40, 출력 y=20
 */

type GateGeometry = {
  body: string;
  extra?: string;
  /** 출력 쪽 반전 동그라미 중심 x */
  bubble?: number;
  /** 몸체 오른쪽 끝(출력선 시작) x */
  outX: number;
  /** 입력선이 몸체에 닿는 x */
  inX: number;
};

const AND_BODY = "M14,12 H38 A28,28 0 0 1 38,68 H14 Z";
const OR_BODY = "M12,12 Q26,40 12,68 Q46,68 64,40 Q46,12 12,12 Z";
const XOR_EXTRA = "M5,12 Q19,40 5,68";
const NOT_BODY = "M16,6 L54,20 L16,34 Z";

const GEOMETRY: Record<GateKind, GateGeometry> = {
  AND: { body: AND_BODY, outX: 66, inX: 14 },
  NAND: { body: AND_BODY, bubble: 70, outX: 74, inX: 14 },
  OR: { body: OR_BODY, outX: 64, inX: 16 },
  NOR: { body: OR_BODY, bubble: 68, outX: 72, inX: 16 },
  XOR: { body: OR_BODY, extra: XOR_EXTRA, outX: 64, inX: 16 },
  XNOR: { body: OR_BODY, extra: XOR_EXTRA, bubble: 68, outX: 72, inX: 16 },
  NOT: { body: NOT_BODY, bubble: 58, outX: 62, inX: 16 },
};

const lead = (on: boolean | undefined) =>
  on ? "var(--cd-wire-on)" : "var(--cd-gate-stroke)";

type GateShapeProps = {
  kind: GateKind;
  /** 입력선 신호 (선 색 표시용) */
  inputs?: boolean[];
  output?: boolean;
  className?: string;
};

export function GateShape({ kind, inputs = [], output = false, className }: GateShapeProps) {
  const g = GEOMETRY[kind];
  const single = kind === "NOT";
  const height = single ? 40 : 80;
  const outY = single ? 20 : 40;
  const inputYs = single ? [20] : [20, 60];

  return (
    <svg
      viewBox={`0 0 80 ${height}`}
      className={className}
      fill="none"
      strokeWidth={2}
      strokeLinejoin="round"
    >
      {inputYs.map((y, i) => (
        <line key={y} x1={0} y1={y} x2={g.inX} y2={y} stroke={lead(inputs[i])} />
      ))}
      <line x1={g.outX} y1={outY} x2={80} y2={outY} stroke={lead(output)} />
      <path d={g.body} fill="var(--cd-gate-fill)" stroke="var(--cd-gate-stroke)" />
      {g.extra && <path d={g.extra} stroke="var(--cd-gate-stroke)" />}
      {g.bubble !== undefined && (
        <circle
          cx={g.bubble}
          cy={outY}
          r={4}
          fill="var(--cd-gate-fill)"
          stroke="var(--cd-gate-stroke)"
        />
      )}
    </svg>
  );
}

/** 전원: LED와 같은 크기의 동그라미 안에 전원 아이콘 */
export function PowerShape({ on = true, className }: { on?: boolean; className?: string }) {
  const color = on ? "var(--cd-wire-on)" : "var(--cd-muted)";
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" strokeLinecap="round">
      <line x1={34} y1={20} x2={40} y2={20} stroke={lead(on)} strokeWidth={2} />
      <circle
        cx={20}
        cy={20}
        r={14}
        fill={on ? "var(--cd-power-on-bg)" : "var(--cd-gate-fill)"}
        stroke="var(--cd-gate-stroke)"
        strokeWidth={2}
      />
      <path d="M15.8 15.2a6.6 6.6 0 1 0 8.4 0" stroke={color} strokeWidth={2.2} />
      <line x1={20} y1={12.5} x2={20} y2={19.5} stroke={color} strokeWidth={2.2} />
    </svg>
  );
}

export function LedShape({ lit = false, className }: { lit?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <line x1={0} y1={20} x2={6} y2={20} stroke={lead(lit)} strokeWidth={2} />
      <circle
        cx={20}
        cy={20}
        r={14}
        fill={lit ? "var(--cd-led-on)" : "var(--cd-led-off)"}
        stroke="var(--cd-gate-stroke)"
        strokeWidth={2}
      />
      {lit && <circle cx={15} cy={15} r={3.5} fill="white" opacity={0.7} />}
    </svg>
  );
}

export function SwitchShape({
  closed = false,
  input = false,
  className,
}: {
  closed?: boolean;
  input?: boolean;
  className?: string;
}) {
  const passing = closed && input;
  return (
    <svg viewBox="0 0 60 40" className={className} fill="none" strokeWidth={2} strokeLinecap="round">
      <line x1={0} y1={20} x2={16} y2={20} stroke={lead(input)} />
      <line x1={44} y1={20} x2={60} y2={20} stroke={lead(passing)} />
      <circle cx={17} cy={20} r={2.5} fill="var(--cd-gate-stroke)" stroke="none" />
      <circle cx={43} cy={20} r={2.5} fill="var(--cd-gate-stroke)" stroke="none" />
      <line
        x1={17}
        y1={20}
        x2={closed ? 43 : 39}
        y2={closed ? 20 : 6}
        stroke={passing ? "var(--cd-wire-on)" : "var(--cd-gate-stroke)"}
      />
    </svg>
  );
}

/** 클럭(사각파) 아이콘 */
export function ClockShape({ className, color }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      fill="none"
      stroke={color ?? "var(--cd-gate-stroke)"}
      strokeWidth={1.8}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M1 13 H6 V3 H12 V13 H18 V3 H23" />
    </svg>
  );
}
