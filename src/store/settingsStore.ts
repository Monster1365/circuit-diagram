import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

/** LED 색 (빨주노초파남보) */
export const LED_COLORS = [
  { id: "red", name: "빨강", value: "#ef4444" },
  { id: "orange", name: "주황", value: "#f97316" },
  { id: "yellow", name: "노랑", value: "#eab308" },
  { id: "green", name: "초록", value: "#22c55e" },
  { id: "blue", name: "파랑", value: "#3b82f6" },
  { id: "indigo", name: "남색", value: "#4f46e5" },
  { id: "violet", name: "보라", value: "#a855f7" },
] as const;

export type LedColorId = (typeof LED_COLORS)[number]["id"];

export const ledColorValue = (id: LedColorId) =>
  (LED_COLORS.find((c) => c.id === id) ?? LED_COLORS[0]).value;

type SettingsState = {
  /** 그룹 점선 상자 표시 */
  showGroupOutlines: boolean;
  /** 켜진 LED 색 */
  ledColor: LedColorId;
  setShowGroupOutlines: (show: boolean) => void;
  setLedColor: (color: LedColorId) => void;
};

/** 사생활 보호 모드 등에서 localStorage가 막혀 있어도 오류 없이 동작하게 감싼다 */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* 저장할 수 없으면 이번 세션에서만 유지 */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* 무시 */
    }
  },
};

/**
 * 사용자 설정. 회로 데이터가 아니라 보는 사람의 취향이므로 브라우저(localStorage)에 저장한다.
 * 서버 렌더링 결과와 어긋나지 않도록 화면이 뜬 뒤에 불러온다 (skipHydration + rehydrate).
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showGroupOutlines: true,
      ledColor: "red",
      setShowGroupOutlines: (showGroupOutlines) => set({ showGroupOutlines }),
      setLedColor: (ledColor) => set({ ledColor }),
    }),
    {
      name: "cd-settings",
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      skipHydration: true,
      partialize: ({ showGroupOutlines, ledColor }) => ({ showGroupOutlines, ledColor }),
    },
  ),
);
