"use client";

import { useCircuitStore } from "@/store/circuitStore";

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

type TopBarProps = {
  toolboxOpen: boolean;
  onToggleToolbox: () => void;
  componentCount: number;
  stable: boolean;
  logOpen: boolean;
  onToggleLog: () => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
};

export default function TopBar({
  toolboxOpen,
  onToggleToolbox,
  componentCount,
  stable,
  logOpen,
  onToggleLog,
  onClearAll,
  onOpenSettings,
}: TopBarProps) {
  const canUndo = useCircuitStore((s) => s.past.length > 0);
  const canRedo = useCircuitStore((s) => s.future.length > 0);
  const undo = useCircuitStore((s) => s.undo);
  const redo = useCircuitStore((s) => s.redo);
  const mod = isMac() ? "⌘" : "Ctrl+";

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-cd-border bg-cd-panel px-3">
      <button
        type="button"
        onClick={onToggleToolbox}
        aria-pressed={toolboxOpen}
        aria-label={toolboxOpen ? "도구상자 닫기" : "도구상자 열기"}
        title={toolboxOpen ? "도구상자 닫기" : "도구상자 열기"}
        className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
          toolboxOpen
            ? "border-cd-border bg-cd-bg hover:border-cd-accent"
            : "border-cd-accent bg-cd-accent text-white"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <rect x={2.5} y={3.5} width={15} height={13} rx={2} />
          <line x1={7.5} y1={3.5} x2={7.5} y2={16.5} />
        </svg>
      </button>
      <div className="flex items-baseline gap-2">
        <span className="rounded-md bg-cd-text px-1.5 py-0.5 text-sm font-bold text-cd-bg">CD</span>
        <span className="text-sm font-semibold">circuit-diagram</span>
      </div>

      <div className="ml-2 flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          aria-label="되돌리기"
          title={`되돌리기 (${mod}Z)`}
          className="cd-icon-btn"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7.5 5 3.5 9l4 4" />
            <path d="M3.5 9h8.5a4.5 4.5 0 0 1 0 9H9" />
          </svg>
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          aria-label="다시 실행"
          title={`다시 실행 (${mod}Shift+Z)`}
          className="cd-icon-btn"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12.5 5 4 4-4 4" />
            <path d="M16.5 9H8a4.5 4.5 0 0 0 0 9h3" />
          </svg>
        </button>
      </div>

      {!stable && (
        <span
          className="text-xs font-medium text-cd-warning"
          title="되먹임 루프 때문에 신호가 한 값으로 정해지지 않습니다."
        >
          ⚠ 회로가 불안정합니다
        </span>
      )}

      {/* 내보내기 / 불러오기 / 테마 전환 버튼이 들어갈 자리 */}
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-cd-muted">부품 {componentCount}개</span>
        <button
          type="button"
          onClick={onToggleLog}
          aria-pressed={logOpen}
          className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
            logOpen
              ? "border-cd-accent bg-cd-accent text-white"
              : "border-cd-border bg-cd-bg hover:border-cd-accent"
          }`}
        >
          로그 보기
        </button>
        <button
          type="button"
          onClick={onClearAll}
          disabled={componentCount === 0}
          className="rounded-md border border-cd-border bg-cd-bg px-3 py-1 text-sm font-medium text-cd-danger transition-colors hover:border-cd-danger disabled:cursor-not-allowed disabled:opacity-40"
        >
          전체 삭제
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="설정"
          title="설정"
          className="cd-icon-btn"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx={12} cy={12} r={3} />
          </svg>
        </button>
      </div>
    </header>
  );
}
