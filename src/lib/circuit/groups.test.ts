import { describe, expect, it } from "vitest";
import { expandGroupSelection, groupMembers, groupName, toggleGroup } from "./groups";

type N = { id: string; selected?: boolean; data: { groupId?: string } };
const node = (id: string, groupId?: string, selected = false): N => ({
  id,
  selected,
  data: { groupId },
});
const selectedIds = (nodes: N[]) => nodes.filter((n) => n.selected).map((n) => n.id);

describe("toggleGroup", () => {
  it("2개 이상 선택하면 새 그룹으로 묶는다", () => {
    const { nodes, action } = toggleGroup([node("a", undefined, true), node("b", undefined, true), node("c")]);
    expect(action).toBe("grouped");
    expect(nodes.map((n) => n.data.groupId)).toEqual(["group-1", "group-1", undefined]);
  });

  it("하나만 선택하면 아무것도 하지 않는다", () => {
    expect(toggleGroup([node("a", undefined, true), node("b")]).action).toBeNull();
  });

  it("그룹 전체가 선택된 상태에서 한 번 더 누르면 풀린다", () => {
    const grouped = toggleGroup([node("a", undefined, true), node("b", undefined, true)]).nodes;
    const { nodes, action } = toggleGroup(grouped);
    expect(action).toBe("ungrouped");
    expect(nodes.every((n) => n.data.groupId === undefined)).toBe(true);
    expect(selectedIds(nodes)).toEqual(["a", "b"]); // 선택은 유지
  });

  it("그룹과 다른 부품을 함께 선택하면 하나의 새 그룹으로 합친다", () => {
    const { nodes, action } = toggleGroup([
      node("a", "group-1", true),
      node("b", "group-1", true),
      node("c", undefined, true),
    ]);
    expect(action).toBe("grouped");
    expect(new Set(nodes.map((n) => n.data.groupId))).toEqual(new Set(["group-2"]));
  });
});

describe("expandGroupSelection", () => {
  const nodes = [node("a", "group-1"), node("b", "group-1"), node("c")];

  it("그룹의 부품 하나를 선택하면 그룹 전체가 선택된다", () => {
    const applied = nodes.map((n) => (n.id === "a" ? { ...n, selected: true } : n));
    expect(selectedIds(expandGroupSelection(applied, [{ id: "a", selected: true }]))).toEqual(["a", "b"]);
  });

  it("그룹 부품 하나가 선택 해제되면 그룹 전체가 해제된다", () => {
    const all = nodes.map((n) => ({ ...n, selected: n.id !== "c" }));
    const applied = all.map((n) => (n.id === "b" ? { ...n, selected: false } : n));
    expect(selectedIds(expandGroupSelection(applied, [{ id: "b", selected: false }]))).toEqual([]);
  });

  it("다른 그룹 부품으로 선택을 옮기면 새 그룹이 선택된다", () => {
    const two = [node("a", "group-1", true), node("b", "group-1", true), node("c", "group-2"), node("d", "group-2")];
    const applied = two.map((n) => ({ ...n, selected: n.id === "c" }));
    const result = expandGroupSelection(applied, [
      { id: "a", selected: false },
      { id: "b", selected: false },
      { id: "c", selected: true },
    ]);
    expect(selectedIds(result)).toEqual(["c", "d"]);
  });
});

it("groupMembers / groupName", () => {
  const groups = groupMembers([node("a", "group-3"), node("b"), node("c", "group-3")]);
  expect([...groups.keys()]).toEqual(["group-3"]);
  expect(groups.get("group-3")!.map((n) => n.id)).toEqual(["a", "c"]);
  expect(groupName("group-3")).toBe("그룹 3");
});
