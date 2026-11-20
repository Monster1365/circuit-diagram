# circuit-diagram (CD)

브라우저에서 논리회로를 그리고 바로 동작을 확인할 수 있는 웹 도구입니다.

## 기능
- 격자무늬 캔버스 (확대/축소, 이동)
- 왼쪽 도구상자에서 부품을 **끌어다 놓거나 클릭**해서 추가
  - 입출력: 전원, 스위치, LED
  - 논리 게이트: AND, OR, NOT, NAND, NOR, XOR, XNOR
- 부품의 연결점(●)을 끌어 다른 부품과 선으로 연결
- 전원·스위치를 클릭해 켜고 끄면 신호가 실시간으로 전달되어 LED와 선 색이 바뀜
- 선택한 부품/선은 Delete 키로 삭제, 상단의 **전체 삭제**로 모두 지우기

## 개발
```bash
npm install
npm run dev     # http://localhost:3000
npm test        # 시뮬레이션 단위 테스트
npm run build
```

Next.js · React Flow(@xyflow/react) · zustand · Tailwind CSS
