import { describe, expect, it } from "vitest";
import { evaluate } from "./catalog";
import { simulate } from "./simulate";
import type { ComponentKind, SimEdge, SimNode } from "./types";

const truth = (kind: ComponentKind) =>
  [
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ].map(([a, b]) => Number(evaluate(kind, [a, b], false)));

describe("게이트 진리표 (00, 01, 10, 11)", () => {
  it.each([
    ["AND", [0, 0, 0, 1]],
    ["OR", [0, 1, 1, 1]],
    ["NAND", [1, 1, 1, 0]],
    ["NOR", [1, 0, 0, 0]],
    ["XOR", [0, 1, 1, 0]],
    ["XNOR", [1, 0, 0, 1]],
  ] as const)("%s", (kind, expected) => {
    expect(truth(kind)).toEqual(expected);
  });

  it("NOT", () => {
    expect(evaluate("NOT", [false], false)).toBe(true);
    expect(evaluate("NOT", [true], false)).toBe(false);
  });
});

const wire = (source: string, target: string, port = 0): SimEdge => ({
  source,
  sourceHandle: "out",
  target,
  targetHandle: `in${port}`,
});

describe("simulate", () => {
  it("전원 → 스위치 → LED: 스위치가 닫혀야 LED가 켜진다", () => {
    const edges = [wire("p", "s"), wire("s", "l")];
    const run = (powerOn: boolean, closed: boolean) =>
      simulate(
        [
          { id: "p", kind: "POWER", on: powerOn },
          { id: "s", kind: "SWITCH", on: closed },
          { id: "l", kind: "LED", on: false },
        ],
        edges,
      ).outputs.l;

    expect(run(true, true)).toBe(true);
    expect(run(true, false)).toBe(false);
    expect(run(false, true)).toBe(false);
  });

  it("연결되지 않은 입력은 0으로 처리한다", () => {
    const nodes: SimNode[] = [
      { id: "p", kind: "POWER", on: true },
      { id: "g", kind: "AND", on: false },
      { id: "n", kind: "NOT", on: false },
    ];
    const result = simulate(nodes, [wire("p", "g", 0)]);
    expect(result.outputs.g).toBe(false);
    expect(result.outputs.n).toBe(true);
    expect(result.stable).toBe(true);
  });

  it("여러 단계로 이어진 회로를 끝까지 전파한다", () => {
    // 노드 순서를 뒤집어도 결과가 같아야 한다
    const nodes: SimNode[] = [
      { id: "l", kind: "LED", on: false },
      { id: "x", kind: "XOR", on: false },
      { id: "n", kind: "NOT", on: false },
      { id: "a", kind: "POWER", on: true },
      { id: "b", kind: "POWER", on: true },
    ];
    const edges = [wire("a", "n"), wire("n", "x", 0), wire("b", "x", 1), wire("x", "l")];
    expect(simulate(nodes, edges).outputs.l).toBe(true);
  });

  it("NOT 게이트 고리는 불안정으로 표시한다", () => {
    const result = simulate([{ id: "n", kind: "NOT", on: false }], [wire("n", "n")]);
    expect(result.stable).toBe(false);
  });

  it("NOR SR 래치는 안정 상태로 수렴한다", () => {
    const nodes: SimNode[] = [
      { id: "s", kind: "POWER", on: true },
      { id: "r", kind: "POWER", on: false },
      { id: "q", kind: "NOR", on: false },
      { id: "qn", kind: "NOR", on: false },
    ];
    const edges = [
      wire("r", "q", 0),
      wire("qn", "q", 1),
      wire("s", "qn", 0),
      wire("q", "qn", 1),
    ];
    const result = simulate(nodes, edges);
    expect(result.stable).toBe(true);
    expect(result.outputs.q).toBe(true);
    expect(result.outputs.qn).toBe(false);
  });
});

describe("클럭", () => {
  it("클럭의 현재 레벨을 그대로 출력한다", () => {
    const run = (level: boolean) =>
      simulate(
        [
          { id: "c", kind: "CLOCK", on: level },
          { id: "l", kind: "LED", on: false },
        ],
        [wire("c", "l")],
      ).outputs.l;
    expect(run(true)).toBe(true);
    expect(run(false)).toBe(false);
  });
});
