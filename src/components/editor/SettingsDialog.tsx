"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { LED_COLORS, useSettingsStore } from "@/store/settingsStore";

/** 설정 팝업. 바깥을 누르거나 Esc를 누르면 닫힌다 */
export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { showGroupOutlines, ledColor, setShowGroupOutlines, setLedColor } = useSettingsStore();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 px-4 pt-20"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cd-settings-title"
        tabIndex={-1}
        className="w-full max-w-sm rounded-xl border border-cd-border bg-cd-bg shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-cd-border px-4 py-3">
          <h2 id="cd-settings-title" className="text-sm font-semibold">
            설정
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="설정 닫기"
            className="cd-icon-btn h-7 w-7 text-cd-muted"
          >
            ✕
          </button>
        </div>

        <div className="divide-y divide-cd-border">
          <Section title="화면">
            <Row label="그룹 점선 표시" hint="그룹으로 묶은 부품 둘레에 점선 상자를 보여줍니다">
              <Switch
                checked={showGroupOutlines}
                onChange={setShowGroupOutlines}
                label="그룹 점선 표시"
              />
            </Row>
            <Row label="LED 색" hint="켜진 LED의 색">
              <div className="flex gap-1.5" role="radiogroup" aria-label="LED 색">
                {LED_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={ledColor === c.id}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => setLedColor(c.id)}
                    className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${
                      ledColor === c.id
                        ? "ring-2 ring-cd-text ring-offset-2 ring-offset-cd-bg"
                        : ""
                    }`}
                    style={{ background: c.value }}
                  />
                ))}
              </div>
            </Row>
            <Row label="테마">
              <div className="flex rounded-md border border-cd-border p-0.5 text-xs">
                <button type="button" disabled className="cd-segment cd-segment--active">
                  화이트
                </button>
                <button type="button" disabled className="cd-segment" title="준비 중">
                  다크
                </button>
              </div>
            </Row>
          </Section>

          <Section title="파일">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled className="cd-soon-btn" title="준비 중">
                내보내기
              </button>
              <button type="button" disabled className="cd-soon-btn" title="준비 중">
                불러오기
              </button>
            </div>
            <p className="mt-2 text-[11px] text-cd-muted">
              다크 모드, 내보내기, 불러오기는 준비 중입니다.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 px-4 py-3">
      <h3 className="text-[11px] font-semibold tracking-wide text-cd-muted">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {hint && <div className="text-[11px] text-cd-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? "bg-cd-accent" : "bg-cd-border"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}
