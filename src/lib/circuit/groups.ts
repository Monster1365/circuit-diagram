/**
 * 그룹 관련 순수 함수.
 * 그룹은 노드 data.groupId 로만 표현한다 (위치는 각 노드가 그대로 가진다).
 * 그룹의 부품 하나를 선택하면 그룹 전체가 함께 선택되어 같이 움직이고 지워진다.
 */

type GroupableNode = {
  id: string;
  selected?: boolean;
  data: { groupId?: string };
};

const GROUP_PREFIX = "group-";

export const groupName = (groupId: string) =>
  `그룹 ${groupId.slice(GROUP_PREFIX.length)}`;

/** 그룹 id → 소속 노드 목록 (처음 나온 순서) */
export function groupMembers<T extends GroupableNode>(nodes: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const n of nodes) {
    const g = n.data.groupId;
    if (!g) continue;
    const list = groups.get(g) ?? [];
    list.push(n);
    groups.set(g, list);
  }
  return groups;
}

/** 새 그룹에 쓸 번호 (가장 큰 그룹 번호 + 1) */
export function nextGroupNumber(nodes: GroupableNode[]): number {
  let max = 0;
  for (const n of nodes) {
    const num = Number(n.data.groupId?.slice(GROUP_PREFIX.length));
    if (Number.isFinite(num)) max = Math.max(max, num);
  }
  return max + 1;
}

export const groupIdOf = (num: number) => `${GROUP_PREFIX}${num}`;

const nextGroupId = (nodes: GroupableNode[]) => groupIdOf(nextGroupNumber(nodes));

/**
 * 선택 변경을 그룹 단위로 넓힌다.
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
    const g = byId.get(c.id)?.data.groupId;
    if (!g) continue;
    (c.selected ? select : deselect).add(g);
  }
  if (select.size === 0 && deselect.size === 0) return nodes;

  return nodes.map((n) => {
    const g = n.data.groupId;
    if (!g) return n;
    const selected = select.has(g) ? true : deselect.has(g) ? false : n.selected;
    return selected === n.selected ? n : { ...n, selected };
  });
}

export type GroupAction = "grouped" | "ungrouped" | null;

/**
 * Ctrl/Cmd + G 동작.
 * - 선택이 정확히 한 그룹 전체이면 → 그룹 해제
 * - 그 밖에 부품이 2개 이상 선택되어 있으면 → 새 그룹으로 묶기 (기존 그룹은 합쳐짐)
 */
export function toggleGroup<T extends GroupableNode>(
  nodes: T[],
): { nodes: T[]; action: GroupAction } {
  const selected = nodes.filter((n) => n.selected);
  if (selected.length === 0) return { nodes, action: null };

  const groupIds = new Set(selected.map((n) => n.data.groupId));
  if (groupIds.size === 1) {
    const [g] = groupIds;
    if (g && nodes.every((n) => n.data.groupId !== g || n.selected)) {
      return {
        nodes: nodes.map((n) =>
          n.data.groupId === g ? { ...n, data: { ...n.data, groupId: undefined } } : n,
        ),
        action: "ungrouped",
      };
    }
  }

  if (selected.length < 2) return { nodes, action: null };
  const id = nextGroupId(nodes);
  return {
    nodes: nodes.map((n) => (n.selected ? { ...n, data: { ...n.data, groupId: id } } : n)),
    action: "grouped",
  };
}
