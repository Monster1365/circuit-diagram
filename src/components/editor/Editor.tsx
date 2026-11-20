"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { GRID, componentSize, isComponentKind } from "@/lib/circuit/catalog";
import { toDocument } from "@/lib/circuit/document";
import { simulate } from "@/lib/circuit/simulate";
import type { CircuitDocument, ComponentKind, SimEdge, SimNode } from "@/lib/circuit/types";
import { useCircuitStore, type CircuitNode } from "@/store/circuitStore";
import { useClockStore } from "@/store/clockStore";
import WireEdge from "./edges/WireEdge";
import GroupOutlines from "./GroupOutlines";
import LogPanel from "./LogPanel";
import ClockNode from "./nodes/ClockNode";
import GateNode from "./nodes/GateNode";
import LedNode from "./nodes/LedNode";
import PowerNode from "./nodes/PowerNode";
import SwitchNode from "./nodes/SwitchNode";
import SelectionBar from "./SelectionBar";
import { SimulationProvider } from "./SimulationContext";
import Toolbox, { DRAG_MIME } from "./Toolbox";
import TopBar from "./TopBar";
import { useClockRunner } from "./useClockRunner";

const nodeTypes: NodeTypes = {
  gate: GateNode,
  power: PowerNode,
  switch: SwitchNode,
  led: LedNode,
  clock: ClockNode,
};

const edgeTypes: EdgeTypes = { wire: WireEdge };

export type EditorProps = {
  /** 처음 열 때 불러올 회로 (불러오기/프로젝트 페이지에서 사용 예정) */
  initialDocument?: CircuitDocument;
  /** 회로가 바뀔 때마다 호출 (자동 저장 등에 사용 예정) */
  onChange?: (doc: CircuitDocument) => void;
};

export default function Editor(props: EditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}

function EditorInner({ initialDocument, onChange }: EditorProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection,
    addComponent,
    toggle,
    clearAll,
    loadDocument,
  } = useCircuitStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      onNodesChange: s.onNodesChange,
      onEdgesChange: s.onEdgesChange,
      onConnect: s.onConnect,
      isValidConnection: s.isValidConnection,
      addComponent: s.addComponent,
      toggle: s.toggle,
      clearAll: s.clearAll,
      loadDocument: s.loadDocument,
    })),
  );
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const clickAddCount = useRef(0);
  const [logOpen, setLogOpen] = useState(false);
  const [toolboxOpen, setToolboxOpen] = useState(true);
  const [toolboxWidth, setToolboxWidth] = useState(232);
  const [logWidth, setLogWidth] = useState(288);
  const toggleGroup = useCircuitStore((s) => s.toggleGroup);

  // Ctrl/Cmd + G: 선택한 부품 그룹 묶기 / 같은 키를 한 번 더 누르면 풀기
  // (한글 입력 상태에서도 동작하도록 key 대신 물리 키 code로 확인)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.code !== "KeyG") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      toggleGroup();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleGroup]);

  useEffect(() => {
    if (initialDocument) loadDocument(initialDocument);
  }, [initialDocument, loadDocument]);

  useEffect(() => {
    onChange?.(toDocument(nodes, edges));
  }, [nodes, edges, onChange]);

  // ── 시뮬레이션 ────────────────────────────────
  useClockRunner(nodes);
  const clockLevels = useClockStore((s) => s.levels);

  // 부품을 끄는 동안(위치만 바뀔 때)은 다시 계산하지 않도록
  // 시뮬레이션에 필요한 값만 문자열 키로 만들어 비교한다.
  const simKey = JSON.stringify({
    nodes: nodes.map<SimNode>((n) => ({
      id: n.id,
      kind: n.data.kind,
      on: n.data.kind === "CLOCK" ? (clockLevels[n.id] ?? false) : n.data.on,
    })),
    edges: edges.map<SimEdge>((e) => ({
      source: e.source,
      sourceHandle: e.sourceHandle,
      target: e.target,
      targetHandle: e.targetHandle,
    })),
  });
  const simulation = useMemo(() => {
    const input = JSON.parse(simKey) as { nodes: SimNode[]; edges: SimEdge[] };
    return simulate(input.nodes, input.edges);
  }, [simKey]);

  // ── 부품 추가 ────────────────────────────────
  const addAt = useCallback(
    (kind: ComponentKind, center: { x: number; y: number }) => {
      // 부품 왼쪽 위가 격자점에 오도록 맞춘다 → 연결점이 항상 격자선 위에 놓인다
      const { width, height } = componentSize(kind);
      const snap = (v: number) => Math.round(v / GRID) * GRID;
      addComponent(kind, {
        x: snap(center.x - width / 2),
        y: snap(center.y - height / 2),
      });
    },
    [addComponent],
  );

  // 클릭: 현재 화면 중앙에 추가. 연달아 누르면 겹치지 않게 조금씩 어긋나게 둔다.
  const addAtViewCenter = useCallback(
    (kind: ComponentKind) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const center = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      const step = (clickAddCount.current++ % 6) * GRID;
      addAt(kind, { x: center.x + step, y: center.y + step });
    },
    [addAt, screenToFlowPosition],
  );

  // 드래그: 놓은 위치에 추가
  const onDragOver = useCallback((event: DragEvent) => {
    if (!event.dataTransfer.types.includes(DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      const kind = event.dataTransfer.getData(DRAG_MIME);
      if (!isComponentKind(kind)) return;
      event.preventDefault();
      addAt(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addAt, screenToFlowPosition],
  );

  // 전원/스위치는 클릭으로 켜고 끈다
  // (연결점을 누른 경우, Shift 등으로 여러 개를 고르는 중인 경우는 제외)
  const onNodeClick: NodeMouseHandler<CircuitNode> = useCallback(
    (event, node) => {
      if ((event.target as Element).closest(".react-flow__handle")) return;
      if (event.shiftKey || event.metaKey || event.ctrlKey) return;
      if (node.data.kind === "POWER" || node.data.kind === "SWITCH") toggle(node.id);
    },
    [toggle],
  );

  const onClearAll = useCallback(() => {
    if (window.confirm("캔버스의 모든 부품과 선을 삭제할까요?")) clearAll();
  }, [clearAll]);

  return (
    <div className="flex h-dvh flex-col">
      <TopBar
        toolboxOpen={toolboxOpen}
        onToggleToolbox={() => setToolboxOpen((open) => !open)}
        componentCount={nodes.length}
        stable={simulation.stable}
        logOpen={logOpen}
        onToggleLog={() => setLogOpen((open) => !open)}
        onClearAll={onClearAll}
      />
      <SimulationProvider value={simulation}>
        <div className="flex min-h-0 flex-1">
          {toolboxOpen && (
            <Toolbox width={toolboxWidth} onResize={setToolboxWidth} onAdd={addAtViewCenter} />
          )}
          <div ref={wrapperRef} className="relative min-w-0 flex-1">
            <ReactFlow<CircuitNode>
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
              onNodeClick={onNodeClick}
              onDragOver={onDragOver}
              onDrop={onDrop}
              forceColorMode="light"
              snapToGrid
              snapGrid={[GRID, GRID]}
              connectionRadius={24}
              connectionLineType={ConnectionLineType.SmoothStep}
              connectionLineStyle={{ stroke: "var(--cd-accent)", strokeWidth: 2.5 }}
              deleteKeyCode={["Backspace", "Delete"]}
              // 화면 이동: 터치패드 두 손가락 스크롤 / 마우스 가운데 버튼 드래그
              // (왼쪽 버튼으로 배경을 끌면 이동 대신 선택 상자)
              panOnScroll
              panOnDrag={[1]}
              zoomOnScroll={false}
              zoomOnPinch
              zoomActivationKeyCode={["Meta", "Control"]}
              // 선택: 배경 드래그로 상자 선택, Shift(또는 Cmd/Ctrl) + 클릭으로 여러 개 선택
              selectionOnDrag
              selectionMode={SelectionMode.Partial}
              selectionKeyCode={null}
              multiSelectionKeyCode={["Shift", "Meta", "Control"]}
              minZoom={0.25}
              maxZoom={3}
            >
              <Background
                variant={BackgroundVariant.Lines}
                gap={GRID}
                color="var(--cd-grid)"
              />
              <Controls showInteractive={false} />
              <GroupOutlines />
              <SelectionBar />
            </ReactFlow>
          </div>
          {logOpen && (
            <LogPanel
              width={logWidth}
              onResize={setLogWidth}
              onClose={() => setLogOpen(false)}
            />
          )}
        </div>
      </SimulationProvider>
    </div>
  );
}
