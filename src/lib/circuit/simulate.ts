import { CATALOG, evaluate } from "./catalog";
import {
  inputIndex,
  isInputPort,
  type SimEdge,
  type SimNode,
  type SimResult,
} from "./types";

/**
 * 회로 전체의 신호를 계산한다. 브라우저에서 실행되는 순수 함수.
 *
 * - 연결되지 않은 입력은 0(false)
 * - 값이 더 이상 바뀌지 않을 때까지 반복 계산(가우스-자이델 방식)
 * - 최대 반복 횟수 안에 안정되지 않으면 stable=false (예: NOT 게이트 고리)
 */
export function simulate(nodes: SimNode[], edges: SimEdge[]): SimResult {
  const nodeIds = new Set(nodes.map((n) => n.id));

  // 노드별 입력 포트 → 연결된 출력 노드 id
  const drivers = new Map<string, (string | undefined)[]>();
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    if (!isInputPort(edge.targetHandle)) continue;
    const list = drivers.get(edge.target) ?? [];
    list[inputIndex(edge.targetHandle!)] = edge.source;
    drivers.set(edge.target, list);
  }

  const outputs: Record<string, boolean> = {};
  for (const node of nodes) outputs[node.id] = false;

  const maxIterations = nodes.length * 2 + 10;
  for (let i = 0; i < maxIterations; i++) {
    let changed = false;
    for (const node of nodes) {
      const spec = CATALOG[node.kind];
      const sources = drivers.get(node.id) ?? [];
      const inputs: boolean[] = [];
      for (let p = 0; p < spec.inputs; p++) {
        const src = sources[p];
        inputs.push(src !== undefined ? outputs[src] : false);
      }
      const next = evaluate(node.kind, inputs, node.on);
      if (outputs[node.id] !== next) {
        outputs[node.id] = next;
        changed = true;
      }
    }
    if (!changed) return { outputs, stable: true };
  }
  return { outputs, stable: false };
}
