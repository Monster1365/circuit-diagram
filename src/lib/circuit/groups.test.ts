import { describe, expect, it } from "vitest";
import {
  buildGroupTree,
  expandGroupSelection,
  groupName,
  membersOf,
  selectedWholeGroup,
  toggleGroup,
} from "./groups";

type N = { id: string; selected?: boolean; data: { groupPath?: string[] } };
const node = (id: string, groupPath?: string[], selected = false): N => ({
  id,
  selected,
  data: { groupPath },
});
const selectedIds = (nodes: N[]) => nodes.filter((n) => n.selected).map((n) => n.id);
const paths = (nodes: N[]) => nodes.map((n) => n.data.groupPath);
const selectAll = (nodes: N[]) => nodes.map((n) => ({ ...n, selected: true }));

describe("toggleGroup", () => {
  it("2개 이상 선택하면 새 그룹으로 묶는다", () => {
    const { nodes, action } = toggleGroup([node("a", undefined, true), node("b", undefined, true), node("c")]);
    expect(action).toBe("grouped");
    expect(paths(nodes)).toEqual([["group-1"], ["group-1"], undefined]);
  });

  it("하나만 선택하면 아무것도 하지 않는다", () => {
    expect(toggleGroup([node("a", undefined, true), node("b")]).action).toBeNull();
  });

  it("그룹 전체가 선택된 상태에서 한 번 더 누르면 풀린다", () => {
    const grouped = toggleGroup([node("a", undefined, true), node("b", undefined, true)]).nodes;
    const { nodes, action } = toggleGroup(grouped);
    expect(action).toBe("ungrouped");
    expect(paths(nodes)).toEqual([undefined, undefined]);
    expect(selectedIds(nodes)).toEqual(["a", "b"]); // 선택은 유지
  });

  it("그룹 1과 그룹 2를 묶으면 그룹 3 안에 들어가고, 풀면 다시 그룹 1·2로 돌아온다", () => {
    const start = [
      node("a", ["group-1"], true),
      node("b", ["group-1"], true),
      node("c", ["group-2"], true),
      node("d", ["group-2"], true),
    ];
    const grouped = toggleGroup(start);
    expect(grouped.action).toBe("grouped");
    expect(paths(grouped.nodes)).toEqual([
      ["group-3", "group-1"],
      ["group-3", "group-1"],
      ["group-3", "group-2"],
      ["group-3", "group-2"],
    ]);

    const ungrouped = toggleGroup(grouped.nodes);
    expect(ungrouped.action).toBe("ungrouped");
    expect(paths(ungrouped.nodes)).toEqual(paths(start));
  });

  it("여러 겹 중첩해도 한 겹씩 풀린다", () => {
    // 그룹 3(그룹 1 + 그룹 2) 과 부품 e를 다시 묶으면 그룹 4
    let nodes = [
      node("a", ["group-3", "group-1"], true),
      node("c", ["group-3", "group-2"], true),
      node("e", undefined, true),
    ];
    nodes = toggleGroup(nodes).nodes;
    expect(paths(nodes)).toEqual([
      ["group-4", "group-3", "group-1"],
      ["group-4", "group-3", "group-2"],
      ["group-4"],
    ]);
    nodes = toggleGroup(nodes).nodes; // 그룹 4 풀기
    expect(paths(nodes)).toEqual([["group-3", "group-1"], ["group-3", "group-2"], undefined]);
  });

  it("새 그룹 번호는 안쪽 그룹 번호와도 겹치지 않는다", () => {
    const { nodes } = toggleGroup([
      node("a", ["group-2", "group-5"], true),
      node("b", undefined, true),
    ]);
    expect(nodes[1].data.groupPath).toEqual(["group-6"]);
  });
});

describe("selectedWholeGroup", () => {
  it("가장 바깥 그룹 하나 전체가 선택되었을 때만 그 id", () => {
    const nodes = [node("a", ["group-3", "group-1"]), node("b", ["group-3", "group-2"]), node("c")];
    expect(selectedWholeGroup(nodes)).toBeNull();
    expect(selectedWholeGroup(selectAll(nodes.slice(0, 2)))).toBe("group-3");
    expect(selectedWholeGroup(selectAll(nodes))).toBeNull(); // 그룹 밖 부품도 선택됨
  });
});

describe("expandGroupSelection", () => {
  const nodes = [node("a", ["group-1"]), node("b", ["group-1"]), node("c")];

  it("그룹의 부품 하나를 선택하면 그룹 전체가 선택된다", () => {
    const applied = nodes.map((n) => (n.id === "a" ? { ...n, selected: true } : n));
    expect(selectedIds(expandGroupSelection(applied, [{ id: "a", selected: true }]))).toEqual(["a", "b"]);
  });

  it("안쪽 그룹 부품을 선택해도 가장 바깥 그룹 전체가 선택된다", () => {
    const nested = [node("a", ["group-3", "group-1"]), node("b", ["group-3", "group-2"]), node("c")];
    const applied = nested.map((n) => (n.id === "a" ? { ...n, selected: true } : n));
    expect(selectedIds(expandGroupSelection(applied, [{ id: "a", selected: true }]))).toEqual(["a", "b"]);
  });

  it("그룹 부품 하나가 선택 해제되면 그룹 전체가 해제된다", () => {
    const all = nodes.map((n) => ({ ...n, selected: n.id !== "c" }));
    const applied = all.map((n) => (n.id === "b" ? { ...n, selected: false } : n));
    expect(selectedIds(expandGroupSelection(applied, [{ id: "b", selected: false }]))).toEqual([]);
  });

  it("다른 그룹 부품으로 선택을 옮기면 새 그룹이 선택된다", () => {
    const two = [
      node("a", ["group-1"], true),
      node("b", ["group-1"], true),
      node("c", ["group-2"]),
      node("d", ["group-2"]),
    ];
    const applied = two.map((n) => ({ ...n, selected: n.id === "c" }));
    const result = expandGroupSelection(applied, [
      { id: "a", selected: false },
      { id: "b", selected: false },
      { id: "c", selected: true },
    ]);
    expect(selectedIds(result)).toEqual(["c", "d"]);
  });
});

describe("buildGroupTree", () => {
  it("그룹 안의 그룹을 트리로 만든다", () => {
    const tree = buildGroupTree([
      node("a", ["group-3", "group-1"]),
      node("x"),
      node("b", ["group-3", "group-2"]),
      node("c", ["group-3", "group-1"]),
    ]);
    const shape = (items: typeof tree): unknown =>
      items.map((i) => (i.type === "node" ? i.node.id : { [i.id]: shape(i.items) }));
    expect(shape(tree)).toEqual([{ "group-3": [{ "group-1": ["a", "c"] }, { "group-2": ["b"] }] }, "x"]);
    expect(membersOf(tree[0]).map((n) => n.id)).toEqual(["a", "c", "b"]);
  });
});

it("groupName", () => {
  expect(groupName("group-3")).toBe("그룹 3");
});
