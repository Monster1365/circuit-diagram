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
import { CATALOG, DEFAULT_CLOCK_PERIOD, LABEL_PREFIX } from "@/lib/circuit/catalog";
import { fromDocument, toDocument } from "@/lib/circuit/document";
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
    set((state) => ({ nodes: changes.applyTo(state.nodes) })),

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
    if (prefix) data.label = `${prefix} ${nextLabelNumber(get().nodes, kind, prefix)}`;
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

  clearAll: () => set({ nodes: [], edges: [] }),

  loadDocument: (doc) => set(fromDocument(doc)),

  getDocument: () => toDocument(get().nodes, get().edges),
}));
