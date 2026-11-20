import type { CircuitNodeType, ComponentKind, GateKind } from "./types";

export type ComponentSpec = {
  kind: ComponentKind;
  label: string;
  description: string;
  nodeType: CircuitNodeType;
  inputs: number;
  outputs: number;
};

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
});

export const CATALOG: Record<ComponentKind, ComponentSpec> = {
  POWER: {
    kind: "POWER",
    label: "전원",
    description: "회로에 신호(1)를 공급합니다. 클릭해서 켜고 끕니다.",
    nodeType: "power",
    inputs: 0,
    outputs: 1,
  },
  SWITCH: {
    kind: "SWITCH",
    label: "스위치",
    description: "닫혀 있을 때만 신호를 통과시킵니다. 클릭해서 열고 닫습니다.",
    nodeType: "switch",
    inputs: 1,
    outputs: 1,
  },
  LED: {
    kind: "LED",
    label: "LED",
    description: "입력이 1이면 불이 켜집니다.",
    nodeType: "led",
    inputs: 1,
    outputs: 0,
  },
  AND: gate("AND", 2, "두 입력이 모두 1일 때 1"),
  OR: gate("OR", 2, "입력 중 하나라도 1이면 1"),
  NOT: gate("NOT", 1, "입력을 반전"),
  NAND: gate("NAND", 2, "AND의 반전"),
  NOR: gate("NOR", 2, "OR의 반전"),
  XOR: gate("XOR", 2, "두 입력이 다를 때 1"),
  XNOR: gate("XNOR", 2, "두 입력이 같을 때 1"),
};

export const IO_KINDS: ComponentKind[] = ["POWER", "SWITCH", "LED"];
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
