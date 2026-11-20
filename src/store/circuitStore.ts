import {
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import {
  CATALOG,
  DEFAULT_CLOCK_PERIOD,
  LABEL_PREFIX,
  MAX_SCALE,
  MIN_SCALE,
} from "@/lib/circuit/catalog";
import { fromDocument, toDocument } from "@/lib/circuit/document";
import {
  expandGroupSelection,
  toggleGroup,
  type GroupAction,
} from "@/lib/circuit/groups";
import {
  OUTPUT_PORT,
  isInputPort,
  type CircuitDocument,
  type CircuitNodeData,
  type CircuitNodeType,
  type ComponentKind,
} from "@/lib/circuit/types";

export type CircuitNode = Node<CircuitNodeData, CircuitNodeType>;

type CircuitState = {
  nodes: CircuitNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<CircuitNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  isValidConnection: (connection: Connection | Edge) => boolean;
  addComponent: (kind: ComponentKind, position: XYPosition) => void;
  toggle: (id: string) => void;
  setClockPeriod: (id: string, period: number) => void;
  /** 선택된 부품들의 크기 배율을 delta만큼 바꾼다 (1~4) */
  changeSelectedScale: (delta: number) => void;
  /** 주어진 부품만 선택 (그룹이면 그룹 전체) */
  selectNodes: (ids: string[]) => void;
  /** 선택한 부품 묶기/풀기 */
  toggleGroup: () => GroupAction;
  clearAll: () => void;
  loadDocument: (doc: CircuitDocument) => void;
  getDocument: () => CircuitDocument;
};

const newId = (prefix: string) =>
  `${prefix.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;

/** 같은 종류 중 가장 큰 번호 + 1 (지워진 번호는 재사용하지 않음) */
function nextLabelNumber(
  nodes: CircuitNode[],
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

export const useCircuitStore = create<CircuitState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) =>
    set((state) => {
      const nodes = changes.applyTo(state.nodes);
      const selections = changes
        .getByType("select")
        .map((c) => ({ id: c.id, selected: c.selected }));
      return { nodes: expandGroupSelection(nodes, selections) };
    }),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: changes.applyTo(state.edges) })),

  onConnect: (connection) => {
    if (!get().isValidConnection(connection)) return;
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: `${connection.source}:${connection.sourceHandle}->${connection.target}:${connection.targetHandle}`,
          type: "wire",
        },
        state.edges,
      ),
    }));
  },

  // 출력(out) → 입력(inN)만 허용, 입력 하나에는 선 하나만, 자기 자신 연결 금지
  isValidConnection: (connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (source === target) return false;
    if (sourceHandle !== OUTPUT_PORT || !isInputPort(targetHandle)) {
      return false;
    }
    return !get().edges.some(
      (e) => e.target === target && e.targetHandle === targetHandle,
    );
  },

  addComponent: (kind, position) => {
    const spec = CATALOG[kind];
    const data: CircuitNodeData = {
      kind,
      // 전원은 켜진 상태, 스위치는 열린 상태로 시작
      on: kind === "POWER",
    };
    const prefix = LABEL_PREFIX[kind];
    data.label = `${prefix} ${nextLabelNumber(get().nodes, kind, prefix)}`;
    if (kind === "CLOCK") data.period = DEFAULT_CLOCK_PERIOD;

    const node: CircuitNode = {
      id: newId(kind),
      type: spec.nodeType,
      position,
      data,
    };
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  toggle: (id) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, on: !n.data.on } } : n,
      ),
    })),

  setClockPeriod: (id, period) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, period } } : n,
      ),
    })),

  changeSelectedScale: (delta) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (!n.selected) return n;
        const current = n.data.scale ?? 1;
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current + delta));
        return scale === current ? n : { ...n, data: { ...n.data, scale } };
      }),
    })),

  selectNodes: (ids) =>
    set((state) => {
      const wanted = new Set(ids);
      const nodes = state.nodes.map((n) => {
        const selected = wanted.has(n.id);
        return n.selected === selected ? n : { ...n, selected };
      });
      return {
        nodes: expandGroupSelection(
          nodes,
          ids.map((id) => ({ id, selected: true })),
        ),
        edges: state.edges.map((e) => (e.selected ? { ...e, selected: false } : e)),
      };
    }),

  toggleGroup: () => {
    const result = toggleGroup(get().nodes);
    if (result.action) set({ nodes: result.nodes });
    return result.action;
  },

  clearAll: () => set({ nodes: [], edges: [] }),

  loadDocument: (doc) => set(fromDocument(doc)),

  getDocument: () => toDocument(get().nodes, get().edges),
}));
