---
trigger: always_on
---

# Browser Test Guide

## 1. 포트 설정

- 브라우저 테스트는 **포트 43000**을 사용한다.

## 2. 포트 충돌 처리

- 43000 포트가 사용 중이면 해당 프로세스를 종료 후 테스트를 시작한다.
- 명령어: `lsof -t -i :43000 | xargs kill -9`

## 3. 테스트 후 정리

- 테스트 완료 후 반드시 개발 서버를 종료하여 포트를 해제한다.

---

## 4. 라운드별 테스트 (Rate Limit 방지)

전체 게임 흐름을 한 번에 테스트하면 Rate Limit(429)에 걸릴 수 있다.  
**라운드별로 테스트를 분리**하여 진행한다.

### 방법 1: npm 스크립트 (권장)

```bash
# Round 1부터 시작
npm run dev

# Round 2부터 시작
npm run dev:r2

# Round 3부터 시작
npm run dev:r3

# 포트 지정 시
npm run dev:r3 -- --port 43000
```

### 방법 2: 브라우저 콘솔 활용

`window.chefStore`가 디버그용으로 노출되어 있어 직접 라운드를 건너뛸 수 있다.

```javascript
// Round 1 건너뛰기 (Round 2로 이동)
window.chefStore.getState().startRound2();

// Round 2 건너뛰기 (Round 3로 이동)
window.chefStore.getState().startRound3();
```

### 권장 테스트 순서

1. Round 1 단독 테스트 (서버 재시작)
2. Round 2 단독 테스트 (`npm run dev:r2`)
3. Round 3 단독 테스트 (`npm run dev:r3`)

---

## 5. 디버그 함수 참고

| 함수                | 설명                            |
| ------------------- | ------------------------------- |
| `startRound2()`     | Round 1을 건너뛰고 Round 2 시작 |
| `startRound3()`     | Round 2를 건너뛰고 Round 3 시작 |
| `playRound3Match()` | Round 3 매치 1회 진행           |
