import type { CircuitNodeType, ComponentKind, GateKind } from "./types";

/** 격자 한 칸 크기(px). 부품 크기와 연결점 위치는 모두 이 값의 배수다. */
export const GRID = 20;

export type ComponentSpec = {
  kind: ComponentKind;
  label: string;
  description: string;
  nodeType: CircuitNodeType;
  inputs: number;
  outputs: number;
  /** 부품 크기 (격자 칸 수) */
  size: { w: number; h: number };
  /** 입력 연결점의 y 위치 (격자 칸 수, 위에서부터) */
  inputYs: number[];
  /** 출력 연결점의 y 위치 (격자 칸 수) */
  outputY: number;
};

// 2입력 게이트: 4×4칸, 입력은 1칸·3칸, 출력은 2칸 높이
// 1입력 게이트(NOT): 4×2칸, 입출력 모두 1칸 높이
const gate = (
  kind: GateKind,
  inputs: number,
  description: string,
): ComponentSpec => ({
  kind,
  label: kind,
  description,
  nodeType: "gate",
  inputs,
  outputs: 1,
  size: inputs === 1 ? { w: 4, h: 2 } : { w: 4, h: 4 },
  inputYs: inputs === 1 ? [1] : [1, 3],
  outputY: inputs === 1 ? 1 : 2,
});

export const CATALOG: Record<ComponentKind, ComponentSpec> = {
  POWER: {
    kind: "POWER",
    label: "전원",
    description: "회로에 신호(1)를 공급합니다. 클릭해서 켜고 끕니다.",
    nodeType: "power",
    inputs: 0,
    outputs: 1,
    size: { w: 2, h: 2 },
    inputYs: [],
    outputY: 1,
  },
  CLOCK: {
    kind: "CLOCK",
    label: "클럭",
    description: "주기마다 0과 1을 번갈아 내보냅니다. +/− 버튼으로 주기를 바꿉니다.",
    nodeType: "clock",
    inputs: 0,
    outputs: 1,
    size: { w: 5, h: 2 },
    inputYs: [],
    outputY: 1,
  },
  SWITCH: {
    kind: "SWITCH",
    label: "스위치",
    description: "닫혀 있을 때만 신호를 통과시킵니다. 클릭해서 열고 닫습니다.",
    nodeType: "switch",
    inputs: 1,
    outputs: 1,
    size: { w: 3, h: 2 },
    inputYs: [1],
    outputY: 1,
  },
  LED: {
    kind: "LED",
    label: "LED",
    description: "입력이 1이면 불이 켜집니다.",
    nodeType: "led",
    inputs: 1,
    outputs: 0,
    size: { w: 2, h: 2 },
    inputYs: [1],
    outputY: 1,
  },
  AND: gate("AND", 2, "두 입력이 모두 1일 때 1"),
  OR: gate("OR", 2, "입력 중 하나라도 1이면 1"),
  NOT: gate("NOT", 1, "입력을 반전"),
  NAND: gate("NAND", 2, "AND의 반전"),
  NOR: gate("NOR", 2, "OR의 반전"),
  XOR: gate("XOR", 2, "두 입력이 다를 때 1"),
  XNOR: gate("XNOR", 2, "두 입력이 같을 때 1"),
};

export const IO_KINDS: ComponentKind[] = ["POWER", "CLOCK", "SWITCH", "LED"];

/** 클럭 주기 단계(ms). +/− 버튼으로 이 값들 사이를 오간다 */
export const CLOCK_PERIODS = [100, 200, 500, 1000, 2000, 5000];
export const DEFAULT_CLOCK_PERIOD = 1000;

export const formatPeriod = (ms: number) =>
  ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`;

/** 이름을 붙이는 부품의 이름 앞부분 */
export const LABEL_PREFIX: Partial<Record<ComponentKind, string>> = {
  LED: "LED",
  CLOCK: "CLK",
};
export const GATE_KINDS: GateKind[] = [
  "AND",
  "OR",
  "NOT",
  "NAND",
  "NOR",
  "XOR",
  "XNOR",
];

export const isComponentKind = (value: unknown): value is ComponentKind =>
  typeof value === "string" && value in CATALOG;

/** 부품 하나의 출력값 계산 */
export function evaluate(
  kind: ComponentKind,
  inputs: boolean[],
  on: boolean,
): boolean {
  const [a = false, b = false] = inputs;
  switch (kind) {
    case "POWER":
    case "CLOCK":
      return on;
    case "SWITCH":
      return on && a;
    case "LED":
      return a;
    case "AND":
      return a && b;
    case "OR":
      return a || b;
    case "NOT":
      return !a;
    case "NAND":
      return !(a && b);
    case "NOR":
      return !(a || b);
    case "XOR":
      return a !== b;
    case "XNOR":
      return a === b;
  }
}
