import { describe, expect, it } from "vitest";
import { findContactEdges, type PlacedComponent } from "./contacts";
import { simulate } from "./simulate";

// 전원: 2×2칸, 출력 (x+40, y+20) / LED: 2×2칸, 입력 (x, y+20)
// AND: 4×4칸, 입력 (x, y+20)·(x, y+60), 출력 (x+80, y+40)
const at = (id: string, kind: PlacedComponent["kind"], x: number, y: number, scale?: number) => ({
  id,
  kind,
  position: { x, y },
  scale,
});

describe("findContactEdges", () => {
  it("출력점과 입력점이 겹치면 연결로 본다", () => {
    const contacts = findContactEdges([at("p", "POWER", 0, 0), at("l", "LED", 40, 0)], []);
    expect(contacts).toEqual([{ source: "p", sourceHandle: "out", target: "l", targetHandle: "in0" }]);
  });

  it("겹치지 않으면 연결하지 않는다", () => {
    expect(findContactEdges([at("p", "POWER", 0, 0), at("l", "LED", 60, 0)], [])).toEqual([]);
  });

  it("입력에 이미 선이 있으면 선을 우선한다", () => {
    const edges = [{ source: "x", sourceHandle: "out", target: "l", targetHandle: "in0" }];
    expect(findContactEdges([at("p", "POWER", 0, 0), at("l", "LED", 40, 0)], edges)).toEqual([]);
  });

  it("게이트의 두 번째 입력, 크기 배율도 위치에 반영한다", () => {
    // 전원 ×2: 4×4칸, 출력 (x+80, y+40) → AND(80, -20)의 두 번째 입력 (80, 40)
    const contacts = findContactEdges([at("p", "POWER", 0, 0, 2), at("g", "AND", 80, -20)], []);
    expect(contacts).toEqual([{ source: "p", sourceHandle: "out", target: "g", targetHandle: "in1" }]);
  });

  it("출력끼리·입력끼리 겹친 것은 무시한다", () => {
    // 두 LED 입력이 같은 자리, 두 전원 출력이 같은 자리
    expect(
      findContactEdges(
        [at("l1", "LED", 0, 0), at("l2", "LED", 0, 0), at("p1", "POWER", 100, 0), at("p2", "POWER", 100, 0)],
        [],
      ),
    ).toEqual([]);
  });

  it("겹친 연결로 신호가 전달된다", () => {
    const components = [at("p", "POWER", 0, 0), at("l", "LED", 40, 0)];
    const contacts = findContactEdges(components, []);
    const result = simulate(
      [
        { id: "p", kind: "POWER", on: true },
        { id: "l", kind: "LED", on: false },
      ],
      contacts,
    );
    expect(result.outputs.l).toBe(true);
  });
});
