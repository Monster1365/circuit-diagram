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
- 그룹: 노드 `data.groupPath`(바깥→안쪽 그룹 id 목록)로만 표현(`src/lib/circuit/groups.ts`). 묶기=경로 앞에 새 그룹 추가, 풀기=맨 앞 제거 → 중첩 그룹 지원. 부품 하나가 선택되면 가장 바깥 그룹 전체 선택(`expandGroupSelection`), 끌기 직전 선택은 `NodeFrame`의 pointerdown에서 처리
- 설정: `src/store/settingsStore.ts` (localStorage, 그룹 점선·LED 색). 서버 렌더링과 어긋나지 않게 `skipHydration` 후 Editor에서 `rehydrate()`
- 크기 배율: `data.scale`(1~4). `NodeFrame`이 내용은 기본 크기로 그린 뒤 확대하고 연결점은 배율 반영 위치에 둔다
- 캔버스 조작: 왼쪽 드래그=선택 상자, 휠/두 손가락=이동, 가운데 버튼 드래그=이동, 핀치·Cmd/Ctrl+휠=확대
- 되돌리기: store의 `checkpoint()`가 변경 직전 상태를 `past`에 기록(최대 100개). 같은 순간의 여러 변경(부품+선 삭제)은 하나로 합치고, 끌기는 시작 시점에 한 번만 기록. 선택 변경은 기록하지 않는다. 새 변경 작업을 추가할 때는 `checkpoint()`를 먼저 호출할 것
- 클립보드: `src/lib/circuit/clipboard.ts` (브라우저 메모리). 단축키는 `Editor.tsx`에서 물리 키 `event.code`로 처리(한글 입력 대응)
- 겹침 연결: `src/lib/circuit/contacts.ts`의 `findContactEdges`가 출력점·입력점이 같은 좌표인 곳을 연결로 계산(선이 있으면 선 우선). Editor에서 선과 합쳐 시뮬레이션하고, 겹친 점은 `cd-handle--joined`로 표시
- 격자 규칙: 부품 크기와 연결점 위치는 `catalog.ts`의 `GRID`(20px) 배수(`size`, `inputYs`, `outputY`). 노드에 CSS border를 쓰면 연결점이 밀리므로 테두리는 SVG나 inset box-shadow로 그린다
- `src/components/editor/` — React Flow 캔버스, 도구상자, 상단바, 부품 노드, 선
- `@xyflow/react`는 v13: 변경 적용은 `changes.applyTo(nodes)`, 색 모드는 `forceColorMode` prop

## 명령
- `npm run dev` / `npm run build` / `npm run lint` / `npm test`

## 예정 기능 (아직 미구현)
- 내보내기/불러오기: `CircuitDocument`(JSON)를 `.cdg` 파일로 저장/읽기 (`toDocument`/`fromDocument`, 스토어의 `getDocument`/`loadDocument` 사용)
- 다크모드: 색은 `globals.css`의 `--cd-*` 변수만 사용 → 다크 테마 변수 정의 + `forceColorMode` 제거/변경
- 로그인·프로젝트 대시보드(DB): `Editor`의 `initialDocument`/`onChange` props로 재사용
