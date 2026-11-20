import type { ComponentKind } from "./types";

type LabeledNode = { data: { kind: ComponentKind; label?: string } };

/** 같은 종류 중 가장 큰 이름 번호 + 1 (지워진 번호는 재사용하지 않음) */
export function nextLabelNumber(
  nodes: LabeledNode[],
  kind: ComponentKind,
  prefix: string,
): number {
  let max = 0;
  for (const n of nodes) {
    if (n.data.kind !== kind || !n.data.label?.startsWith(`${prefix} `)) continue;
    const num = Number(n.data.label.slice(prefix.length + 1));
    if (Number.isFinite(num)) max = Math.max(max, num);
  }
  return max + 1;
}
