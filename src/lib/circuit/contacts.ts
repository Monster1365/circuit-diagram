import { CATALOG, GRID } from "./catalog";
import { OUTPUT_PORT, inputPort, type ComponentKind, type SimEdge } from "./types";

/** 연결점 위치 계산에 필요한 부품 정보 */
export type PlacedComponent = {
  id: string;
  kind: ComponentKind;
  position: { x: number; y: number };
  scale?: number;
};

/** 포트를 가리키는 키 ("노드id:포트id") */
export const portKey = (nodeId: string, handle: string) => `${nodeId}:${handle}`;

const pointKey = (x: number, y: number) => `${Math.round(x)},${Math.round(y)}`;

/** 부품의 입력·출력 연결점 위치 (캔버스 좌표) */
export function portPositions(c: PlacedComponent) {
  const spec = CATALOG[c.kind];
  const unit = GRID * (c.scale ?? 1);
  return {
    inputs: spec.inputYs.map((y, i) => ({
      handle: inputPort(i),
      x: c.position.x,
      y: c.position.y + y * unit,
    })),
    output:
      spec.outputs > 0
        ? { x: c.position.x + spec.size.w * unit, y: c.position.y + spec.outputY * unit }
        : null,
  };
}

/**
 * 선 없이 연결점끼리 맞닿은 곳을 찾아 연결로 돌려준다.
 * - 한 부품의 출력점과 다른 부품의 입력점이 같은 위치에 있으면 연결된 것으로 본다
 * - 그 입력에 이미 선이 연결되어 있으면 선을 우선한다
 * - 출력끼리, 입력끼리 맞닿은 것은 신호를 주고받을 수 없으므로 무시한다
 * - 한 입력에 출력 여러 개가 맞닿으면 먼저 놓인 부품 하나만 연결한다
 */
export function findContactEdges(components: PlacedComponent[], edges: SimEdge[]): SimEdge[] {
  const outputAt = new Map<string, string>();
  const ports = components.map((c) => ({ c, ...portPositions(c) }));
  for (const { c, output } of ports) {
    if (!output) continue;
    const key = pointKey(output.x, output.y);
    if (!outputAt.has(key)) outputAt.set(key, c.id);
  }

  const wired = new Set(edges.map((e) => portKey(e.target, e.targetHandle ?? "")));
  const contacts: SimEdge[] = [];
  for (const { c, inputs } of ports) {
    for (const input of inputs) {
      if (wired.has(portKey(c.id, input.handle))) continue;
      const source = outputAt.get(pointKey(input.x, input.y));
      if (!source || source === c.id) continue;
      contacts.push({ source, sourceHandle: OUTPUT_PORT, target: c.id, targetHandle: input.handle });
    }
  }
  return contacts;
}
