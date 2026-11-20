/** 논리 게이트 종류 */
export type GateKind = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "XNOR";

/** 캔버스에 놓을 수 있는 모든 부품 종류 */
export type ComponentKind = GateKind | "POWER" | "SWITCH" | "LED";

/** React Flow 노드 타입 (렌더링 컴포넌트 선택용) */
export type CircuitNodeType = "gate" | "power" | "switch" | "led";

/**
 * 노드에 저장되는 데이터. 직렬화 가능한 값만 둔다.
 * 계산된 신호는 여기 저장하지 않고 simulate()로 매번 계산한다.
 */
export type CircuitNodeData = {
  kind: ComponentKind;
  /** 전원: 켜짐 / 스위치: 닫힘. 다른 부품은 사용하지 않음 */
  on: boolean;
};

/** 포트(연결점) id 규칙: 입력은 in0, in1 … / 출력은 out */
export const OUTPUT_PORT = "out";
export const inputPort = (index: number) => `in${index}`;
export const isInputPort = (handle: string | null | undefined) =>
  !!handle && /^in\d+$/.test(handle);
export const inputIndex = (handle: string) => Number(handle.slice(2));

/** 시뮬레이션 입력으로 쓰는 최소한의 노드/선 형태 */
export type SimNode = { id: string; kind: ComponentKind; on: boolean };
export type SimEdge = {
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
};

/** 시뮬레이션 결과 */
export type SimResult = {
  /** 노드별 출력 신호 (LED는 켜짐 여부) */
  outputs: Record<string, boolean>;
  /** 되먹임 루프로 값이 계속 바뀌면 false */
  stable: boolean;
};

/**
 * 저장/내보내기용 문서 형식 (.cdg 파일, 추후 DB 저장에도 사용 예정).
 * 형식이 바뀌면 version을 올리고 변환 함수를 추가한다.
 */
export type CircuitDocument = {
  format: "cd";
  version: 1;
  nodes: {
    id: string;
    kind: ComponentKind;
    position: { x: number; y: number };
    on: boolean;
  }[];
  edges: {
    id: string;
    source: string;
    sourcePort: string;
    target: string;
    targetPort: string;
  }[];
};
