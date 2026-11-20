/**
 * 그룹 관련 순수 함수.
 *
 * 그룹은 노드 data.groupPath 로만 표현한다. 바깥 그룹부터 안쪽 그룹 순서의 id 목록이다.
 *   예) ["group-3", "group-1"] → 그룹 3 안의 그룹 1에 속한 부품
 * - 묶기: 선택한 부품들의 경로 맨 앞에 새 그룹을 붙인다 → 기존 그룹은 새 그룹 안에 들어간다
 * - 풀기: 경로 맨 앞(가장 바깥 그룹)만 뗀다 → 안쪽 그룹이 그대로 되살아난다
 * 그룹의 부품 하나를 선택하면 가장 바깥 그룹 전체가 함께 선택되어 같이 움직이고 지워진다.
 */

type GroupableNode = {
  id: string;
  selected?: boolean;
  data: { groupPath?: string[] };
};

const GROUP_PREFIX = "group-";

export const groupName = (groupId: string) => `그룹 ${groupId.slice(GROUP_PREFIX.length)}`;

export const groupIdOf = (num: number) => `${GROUP_PREFIX}${num}`;

/** 가장 바깥 그룹 id (그룹이 없으면 undefined) */
export const topGroupOf = (n: GroupableNode) => n.data.groupPath?.[0];

/** 새 그룹에 쓸 번호 (안쪽 그룹까지 포함해 가장 큰 그룹 번호 + 1) */
export function nextGroupNumber(nodes: GroupableNode[]): number {
  let max = 0;
  for (const n of nodes) {
    for (const g of n.data.groupPath ?? []) {
      const num = Number(g.slice(GROUP_PREFIX.length));
      if (Number.isFinite(num)) max = Math.max(max, num);
    }
  }
  return max + 1;
}

// ── 트리 (도구상자 목록, 그룹 외곽선용) ───────────────────

export type GroupTreeItem<T> =
  | { type: "group"; id: string; items: GroupTreeItem<T>[] }
  | { type: "node"; node: T };

/** 노드 목록을 그룹 트리로 만든다. 그룹·부품은 처음 나온 순서대로 놓인다 */
export function buildGroupTree<T extends GroupableNode>(nodes: T[]): GroupTreeItem<T>[] {
  const root: GroupTreeItem<T>[] = [];
  const groups = new Map<string, Extract<GroupTreeItem<T>, { type: "group" }>>();
  for (const node of nodes) {
    let container = root;
    for (const id of node.data.groupPath ?? []) {
      let group = groups.get(id);
      if (!group) {
        group = { type: "group", id, items: [] };
        groups.set(id, group);
        container.push(group);
      }
      container = group.items;
    }
    container.push({ type: "node", node });
  }
  return root;
}

/** 트리 항목에 속한 모든 부품 */
export function membersOf<T>(item: GroupTreeItem<T>): T[] {
  return item.type === "node" ? [item.node] : item.items.flatMap(membersOf);
}

// ── 선택 ───────────────────────────────────────────

/**
 * 선택 변경을 가장 바깥 그룹 단위로 넓힌다.
 * 그룹의 한 부품이라도 선택되면 그룹 전체를 선택하고,
 * (선택된 부품이 없는 그룹에서) 한 부품이라도 선택 해제되면 그룹 전체를 해제한다.
 */
export function expandGroupSelection<T extends GroupableNode>(
  nodes: T[],
  changes: { id: string; selected: boolean }[],
): T[] {
  if (changes.length === 0) return nodes;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const select = new Set<string>();
  const deselect = new Set<string>();
  for (const c of changes) {
    const node = byId.get(c.id);
    const g = node && topGroupOf(node);
    if (!g) continue;
    (c.selected ? select : deselect).add(g);
  }
  if (select.size === 0 && deselect.size === 0) return nodes;

  return nodes.map((n) => {
    const g = topGroupOf(n);
    if (!g) return n;
    const selected = select.has(g) ? true : deselect.has(g) ? false : n.selected;
    return selected === n.selected ? n : { ...n, selected };
  });
}

/** 선택이 정확히 가장 바깥 그룹 하나 전체이면 그 그룹 id */
export function selectedWholeGroup(nodes: GroupableNode[]): string | null {
  const selected = nodes.filter((n) => n.selected);
  if (selected.length === 0) return null;
  const tops = new Set(selected.map(topGroupOf));
  if (tops.size !== 1) return null;
  const [g] = tops;
  if (!g) return null;
  return nodes.every((n) => topGroupOf(n) !== g || n.selected) ? g : null;
}

export type GroupAction = "grouped" | "ungrouped" | null;

/**
 * Ctrl/Cmd + G 동작.
 * - 선택이 정확히 한 그룹 전체이면 → 그 그룹을 푼다 (안쪽 그룹은 그대로 남는다)
 * - 그 밖에 부품이 2개 이상 선택되어 있으면 → 새 그룹으로 묶는다 (기존 그룹은 새 그룹 안으로)
 */
export function toggleGroup<T extends GroupableNode>(
  nodes: T[],
): { nodes: T[]; action: GroupAction } {
  const whole = selectedWholeGroup(nodes);
  if (whole) {
    return {
      nodes: nodes.map((n) => {
        if (topGroupOf(n) !== whole) return n;
        const rest = n.data.groupPath!.slice(1);
        return { ...n, data: { ...n.data, groupPath: rest.length ? rest : undefined } };
      }),
      action: "ungrouped",
    };
  }

  if (nodes.filter((n) => n.selected).length < 2) return { nodes, action: null };
  const id = groupIdOf(nextGroupNumber(nodes));
  return {
    nodes: nodes.map((n) =>
      n.selected ? { ...n, data: { ...n.data, groupPath: [id, ...(n.data.groupPath ?? [])] } } : n,
    ),
    action: "grouped",
  };
}
