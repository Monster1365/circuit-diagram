"use client";

type TopBarProps = {
  componentCount: number;
  stable: boolean;
  logOpen: boolean;
  onToggleLog: () => void;
  onClearAll: () => void;
};

export default function TopBar({
  componentCount,
  stable,
  logOpen,
  onToggleLog,
  onClearAll,
}: TopBarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-cd-border bg-cd-panel px-4">
      <div className="flex items-baseline gap-2">
        <span className="rounded-md bg-cd-text px-1.5 py-0.5 text-sm font-bold text-cd-bg">
          CD
        </span>
        <span className="text-sm font-semibold">circuit-diagram</span>
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
      </div>
    </header>
  );
}
