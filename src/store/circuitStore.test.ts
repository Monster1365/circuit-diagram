import { beforeEach, describe, expect, it } from "vitest";
import { PASTE_OFFSET, useCircuitStore } from "./circuitStore";

const store = () => useCircuitStore.getState();
/** 실제 사용에서는 조작마다 이벤트가 따로 오므로, 기록이 합쳐지지 않게 한 틱 쉰다 */
const tick = () => new Promise((r) => setTimeout(r, 0));
const labels = () => store().nodes.map((n) => n.data.label);

beforeEach(() => {
  useCircuitStore.setState({
    nodes: [],
    edges: [],
    past: [],
    future: [],
    clipboard: null,
    pasteCount: 0,
  });
});

describe("되돌리기 / 다시 실행", () => {
  it("추가를 하나씩 되돌리고 다시 실행한다", async () => {
    store().addComponent("AND", { x: 0, y: 0 });
    await tick();
    store().addComponent("LED", { x: 100, y: 0 });
    await tick();
    expect(labels()).toEqual(["AND 1", "LED 1"]);

    expect(store().undo()).toBe(true);
    expect(labels()).toEqual(["AND 1"]);
    expect(store().undo()).toBe(true);
    expect(labels()).toEqual([]);
    expect(store().undo()).toBe(false);

    store().redo();
    store().redo();
    expect(labels()).toEqual(["AND 1", "LED 1"]);
  });

  it("새 변경을 하면 다시 실행 기록은 사라진다", async () => {
    store().addComponent("AND", { x: 0, y: 0 });
    await tick();
    store().undo();
    store().addComponent("OR", { x: 0, y: 0 });
    expect(store().redo()).toBe(false);
  });

  it("전체 삭제도 되돌릴 수 있다", async () => {
    store().addComponent("AND", { x: 0, y: 0 });
    await tick();
    store().clearAll();
    expect(store().nodes).toHaveLength(0);
    store().undo();
    expect(labels()).toEqual(["AND 1"]);
  });
});

describe("복사 / 붙여넣기 / 복제", () => {
  async function twoConnected() {
    store().addComponent("POWER", { x: 0, y: 0 });
    await tick();
    store().addComponent("LED", { x: 100, y: 0 });
    await tick();
    const [p, l] = store().nodes;
    store().onConnect({ source: p.id, sourceHandle: "out", target: l.id, targetHandle: "in0" });
    await tick();
    store().selectAll();
  }

  it("복사한 부품과 그 사이의 선을 새 이름으로 붙여넣는다", async () => {
    await twoConnected();
    expect(store().copy()).toBe(true);
    expect(store().paste()).toBe(true);

    const { nodes, edges } = store();
    expect(labels()).toEqual(["전원 1", "LED 1", "전원 2", "LED 2"]);
    expect(nodes.slice(2).map((n) => n.position)).toEqual([
      { x: PASTE_OFFSET, y: PASTE_OFFSET },
      { x: 100 + PASTE_OFFSET, y: PASTE_OFFSET },
    ]);
    // 붙여넣은 것만 선택되고, 선은 새 부품끼리 연결된다
    expect(nodes.map((n) => !!n.selected)).toEqual([false, false, true, true]);
    expect(edges).toHaveLength(2);
    expect(edges[1].source).toBe(nodes[2].id);
    expect(edges[1].target).toBe(nodes[3].id);
  });

  it("여러 번 붙여넣으면 점점 더 비켜 놓는다", async () => {
    store().addComponent("AND", { x: 0, y: 0 });
    store().selectAll();
    store().copy();
    store().paste();
    await tick();
    store().paste();
    expect(store().nodes.map((n) => n.position.x)).toEqual([0, PASTE_OFFSET, PASTE_OFFSET * 2]);
  });

  it("복제는 클립보드를 바꾸지 않는다", async () => {
    store().addComponent("AND", { x: 0, y: 0 });
    store().selectAll();
    expect(store().duplicate()).toBe(true);
    expect(store().clipboard).toBeNull();
    expect(labels()).toEqual(["AND 1", "AND 2"]);
  });

  it("잘라내기는 부품과 이어진 선을 지우고 되돌릴 수 있다", async () => {
    await twoConnected();
    store().selectNodes([store().nodes[0].id]);
    await tick();
    expect(store().cut()).toBe(true);
    expect(labels()).toEqual(["LED 1"]);
    expect(store().edges).toHaveLength(0);
    await tick();
    store().undo();
    expect(store().edges).toHaveLength(1);
  });

  it("그룹을 붙여넣으면 새 그룹 번호를 받는다", async () => {
    store().addComponent("AND", { x: 0, y: 0 });
    store().addComponent("OR", { x: 100, y: 0 });
    store().selectAll();
    store().toggleGroup();
    store().copy();
    store().paste();
    expect(store().nodes.map((n) => n.data.groupPath)).toEqual([
      ["group-1"],
      ["group-1"],
      ["group-2"],
      ["group-2"],
    ]);
  });

  it("중첩 그룹을 붙여넣으면 안쪽 그룹까지 새 번호를 받는다", async () => {
    for (const kind of ["AND", "OR", "NOT", "NOR"] as const) store().addComponent(kind, { x: 0, y: 0 });
    const ids = store().nodes.map((n) => n.id);
    store().selectNodes(ids.slice(0, 2));
    store().toggleGroup(); // 그룹 1
    store().selectNodes(ids.slice(2));
    store().toggleGroup(); // 그룹 2
    store().selectAll();
    store().toggleGroup(); // 그룹 3 (그룹 1 + 그룹 2)
    store().copy();
    store().paste();
    expect(store().nodes.slice(4).map((n) => n.data.groupPath)).toEqual([
      ["group-4", "group-5"],
      ["group-4", "group-5"],
      ["group-4", "group-6"],
      ["group-4", "group-6"],
    ]);
  });

  it("선택이 없으면 복사·복제하지 않는다", () => {
    expect(store().copy()).toBe(false);
    expect(store().duplicate()).toBe(false);
    expect(store().paste()).toBe(false);
  });
});

it("전체 선택", async () => {
  store().addComponent("AND", { x: 0, y: 0 });
  store().addComponent("OR", { x: 100, y: 0 });
  store().selectAll();
  expect(store().nodes.every((n) => n.selected)).toBe(true);
});
