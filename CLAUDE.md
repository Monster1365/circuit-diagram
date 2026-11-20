@AGENTS.md

# circuit-diagram (CD)

브라우저에서 논리회로를 그리고 시뮬레이션하는 Next.js 앱. Vercel 배포 예정이며, 회로 시뮬레이션은 모두 클라이언트(브라우저)에서 실행한다.

## Claude 작업 규칙
1. 개발은 `develop` 브랜치에서 한다.
2. 사용자의 허락 없이 commit, push, merge 하지 않는다. 단, merge 요청에는 push까지 포함된다.
3. 사용자는 한국인이므로 답변과 설명은 한글로 작성한다.

## 구조
- `src/lib/circuit/` — 부품 정의(`catalog.ts`), 시뮬레이션(`simulate.ts`, 순수 함수), 저장 문서 형식(`types.ts`의 `CircuitDocument`, `document.ts`)
- `src/store/circuitStore.ts` — zustand 스토어 (노드/선, 연결 검증, 토글, 클럭 주기, 전체 삭제). 저장되는 회로 데이터
- `src/store/clockStore.ts` — 클럭의 현재 레벨과 변화 기록(로그 그래프용). 저장하지 않는 실행 상태
- 격자 규칙: 부품 크기와 연결점 위치는 `catalog.ts`의 `GRID`(20px) 배수(`size`, `inputYs`, `outputY`). 노드에 CSS border를 쓰면 연결점이 밀리므로 테두리는 SVG나 inset box-shadow로 그린다
- `src/components/editor/` — React Flow 캔버스, 도구상자, 상단바, 부품 노드, 선
- `@xyflow/react`는 v13: 변경 적용은 `changes.applyTo(nodes)`, 색 모드는 `forceColorMode` prop

## 명령
- `npm run dev` / `npm run build` / `npm run lint` / `npm test`

## 예정 기능 (아직 미구현)
- 내보내기/불러오기: `CircuitDocument`(JSON)를 `.cdg` 파일로 저장/읽기 (`toDocument`/`fromDocument`, 스토어의 `getDocument`/`loadDocument` 사용)
- 다크모드: 색은 `globals.css`의 `--cd-*` 변수만 사용 → 다크 테마 변수 정의 + `forceColorMode` 제거/변경
- 로그인·프로젝트 대시보드(DB): `Editor`의 `initialDocument`/`onChange` props로 재사용
