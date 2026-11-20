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
  GRID,
  LABEL_PREFIX,
  MAX_SCALE,
  MIN_SCALE,
} from "@/lib/circuit/catalog";
import { copySelection, edgeId, pasteClipboard, type ClipboardData } from "@/lib/circuit/clipboard";
import { fromDocument, toDocument } from "@/lib/circuit/document";
import { expandGroupSelection, toggleGroup, type GroupAction } from "@/lib/circuit/groups";
import { nextLabelNumber } from "@/lib/circuit/labels";
import {
  OUTPUT_PORT,
  isInputPort,
  type CircuitDocument,
  type CircuitNodeData,
  type CircuitNodeType,
  type ComponentKind,
} from "@/lib/circuit/types";

export type CircuitNode = Node<CircuitNodeData, CircuitNodeType>;

/** 되돌리기용으로 기록하는 회로 상태 */
type Snapshot = { nodes: CircuitNode[]; edges: Edge[] };

/** 되돌리기 기록 최대 개수 */
export const HISTORY_LIMIT = 100;
/** 붙여넣기·복제할 때 비켜 놓는 거리 (격자 2칸) */
export const PASTE_OFFSET = GRID * 2;

type CircuitState = {
  nodes: CircuitNode[];
  edges: Edge[];
  /** 되돌리기 / 다시 실행 기록 */
  past: Snapshot[];
  future: Snapshot[];
  /** 복사해 둔 부품 (브라우저 메모리에만 보관) */
  clipboard: ClipboardData | null;
  /** 같은 복사본을 몇 번 붙여넣었는지 (붙일 때마다 조금씩 더 비켜 놓기 위해) */
  pasteCount: number;
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
  /** 아래 동작들은 실제로 무언가 했으면 true */
  copy: () => boolean;
  cut: () => boolean;
  paste: () => boolean;
  duplicate: () => boolean;
  selectAll: () => void;
  undo: () => boolean;
  redo: () => boolean;
  loadDocument: (doc: CircuitDocument) => void;
  getDocument: () => CircuitDocument;
};

const newId = (prefix: string) => `${prefix.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;

export const useCircuitStore = create<CircuitState>((set, get) => {
  /**
   * 바뀌기 직전 상태를 되돌리기 기록에 남긴다.
   * 한 번의 조작이 여러 변경으로 나뉘어 들어와도(예: 부품 삭제 + 연결된 선 삭제)
   * 같은 순간의 변경은 기록 하나로 합친다.
   */
  let checkpointQueued = false;
  const checkpoint = () => {
    if (checkpointQueued) return;
    checkpointQueued = true;
    queueMicrotask(() => {
      checkpointQueued = false;
    });
    const { nodes, edges, past } = get();
    set({ past: [...past.slice(-(HISTORY_LIMIT - 1)), { nodes, edges }], future: [] });
  };
  /** 끌기 중인지. 끌기 한 번(시작~끝)을 기록 하나로 남기기 위해 사용 */
  let dragging = false;

  /** 선택된 부품·선과, 선택된 부품에 이어진 선을 지운다 */
  const removeSelected = () => {
    const { nodes, edges } = get();
    const removed = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    if (removed.size === 0 && !edges.some((e) => e.selected)) return false;
    checkpoint();
    set({
      nodes: nodes.filter((n) => !removed.has(n.id)),
      edges: edges.filter((e) => !e.selected && !removed.has(e.source) && !removed.has(e.target)),
    });
    return true;
  };

  /** 복사본을 기존 선택 대신 선택된 상태로 추가한다 */
  const insertCopy = (clip: ClipboardData, offset: number) => {
    checkpoint();
    const { nodes, edges } = get();
    const pasted = pasteClipboard(nodes, clip, offset, newId);
    set({
      nodes: [...nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), ...pasted.nodes],
      edges: [...edges.map((e) => (e.selected ? { ...e, selected: false } : e)), ...pasted.edges],
    });
  };

  return {
    nodes: [],
    edges: [],
    past: [],
    future: [],
    clipboard: null,
    pasteCount: 0,

    onNodesChange: (changes) =>
      set((state) => {
        const positions = changes.getByType("position");
        const isDragging = positions.some((c) => c.dragging);
        if (changes.getByType("remove").length > 0 || (isDragging && !dragging)) checkpoint();
        if (isDragging) dragging = true;
        else if (positions.length > 0) dragging = false;

        const nodes = changes.applyTo(state.nodes);
        const selections = changes
          .getByType("select")
          .map((c) => ({ id: c.id, selected: c.selected }));
        return { nodes: expandGroupSelection(nodes, selections) };
      }),

    onEdgesChange: (changes) => {
      if (changes.getByType("remove").length > 0) checkpoint();
      set((state) => ({ edges: changes.applyTo(state.edges) }));
    },

    onConnect: (connection) => {
      if (!get().isValidConnection(connection)) return;
      checkpoint();
      set((state) => ({
        edges: addEdge({ ...connection, id: edgeId(connection), type: "wire" }, state.edges),
      }));
    },

    // 출력(out) → 입력(inN)만 허용, 입력 하나에는 선 하나만, 자기 자신 연결 금지
    isValidConnection: (connection) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      if (source === target) return false;
      if (sourceHandle !== OUTPUT_PORT || !isInputPort(targetHandle)) {
        return false;
      }
      return !get().edges.some((e) => e.target === target && e.targetHandle === targetHandle);
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
      checkpoint();
      set((state) => ({ nodes: [...state.nodes, node] }));
    },

    toggle: (id) => {
      checkpoint();
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, on: !n.data.on } } : n,
        ),
      }));
    },

    setClockPeriod: (id, period) => {
      checkpoint();
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, period } } : n)),
      }));
    },

    changeSelectedScale: (delta) => {
      if (!get().nodes.some((n) => n.selected)) return;
      checkpoint();
      set((state) => ({
        nodes: state.nodes.map((n) => {
          if (!n.selected) return n;
          const current = n.data.scale ?? 1;
          const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current + delta));
          return scale === current ? n : { ...n, data: { ...n.data, scale } };
        }),
      }));
    },

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
      if (result.action) {
        checkpoint();
        set({ nodes: result.nodes });
      }
      return result.action;
    },

    clearAll: () => {
      if (get().nodes.length === 0 && get().edges.length === 0) return;
      checkpoint();
      set({ nodes: [], edges: [] });
    },

    copy: () => {
      const clip = copySelection(get().nodes, get().edges);
      if (!clip) return false;
      set({ clipboard: clip, pasteCount: 0 });
      return true;
    },

    cut: () => {
      const clip = copySelection(get().nodes, get().edges);
      if (!clip) return false;
      set({ clipboard: clip, pasteCount: 0 });
      return removeSelected();
    },

    paste: () => {
      const { clipboard, pasteCount } = get();
      if (!clipboard) return false;
      insertCopy(clipboard, PASTE_OFFSET * (pasteCount + 1));
      set({ pasteCount: pasteCount + 1 });
      return true;
    },

    // 클립보드를 건드리지 않고 선택한 부품을 바로 복제
    duplicate: () => {
      const clip = copySelection(get().nodes, get().edges);
      if (!clip) return false;
      insertCopy(clip, PASTE_OFFSET);
      return true;
    },

    selectAll: () =>
      set((state) => ({
        nodes: state.nodes.map((n) => (n.selected ? n : { ...n, selected: true })),
        edges: state.edges.map((e) => (e.selected ? e : { ...e, selected: true })),
      })),

    undo: () => {
      const { past, future, nodes, edges } = get();
      const previous = past.at(-1);
      if (!previous) return false;
      dragging = false;
      set({
        ...previous,
        past: past.slice(0, -1),
        future: [...future, { nodes, edges }],
      });
      return true;
    },

    redo: () => {
      const { past, future, nodes, edges } = get();
      const next = future.at(-1);
      if (!next) return false;
      dragging = false;
      set({
        ...next,
        past: [...past, { nodes, edges }],
        future: future.slice(0, -1),
      });
      return true;
    },

    // 다른 회로를 불러오면 되돌리기 기록은 비운다
    loadDocument: (doc) => set({ ...fromDocument(doc), past: [], future: [] }),

    getDocument: () => toDocument(get().nodes, get().edges),
  };
});
