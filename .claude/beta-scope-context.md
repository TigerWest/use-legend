# beta-scope 브랜치 컨텍스트

> 브랜치: `beta-scope` (base: `main`)
> 최종 업데이트: 2026-04-11

---

## 완료: double-trigger 수정 ✅

### 결과

- core: **1049 tests passing**
- web: **1451 tests passing**
- 13개 실패 테스트 모두 통과

---

## 근본 원인: Stale dist

`packages/web`는 `@usels/core`를 **workspace:\*** 로 링크하며 `packages/core/package.json`의 `main`이 `./dist/index.js`를 가리킨다.

결과: **web 테스트는 `packages/core/dist/`의 빌드 산출물을 import**. 소스를 수정해도 core를 재빌드하지 않으면 stale dist의 구버전 로직으로 돌아간다.

이전 세션에서 `subscribeObsField` 수정을 source에만 반영하고 dist에는 반영하지 않아, web 테스트는 여전히 **setToObservable 구버전**을 실행 중이었다.

### 검증 방법

```bash
grep -l "subscribeObsField" packages/core/dist/*.js
# 비어있으면 dist가 stale
```

---

## 수정 내역

### 1. `packages/core/src/primitives/useScope/reactiveProps.ts`

- `subscribeObsField` 방식 유지: Observable 필드는 `peek()` 값으로 저장하고 `onChange` 구독으로 sync
- `batch()` 래핑으로 child/root notify를 1회로 묶음

### 2. `packages/web/src/elements/useIntersectionObserver/core.ts`

- Library guide 패턴 준수: `opts$.get()` 후 plain object 필드 접근 (`raw?.root`, `raw?.rootMargin`, `raw?.threshold`)
- Pre-cache child refs 시도는 원복 — 불필요한 복잡도

### 3. `packages/core/dist/` **재빌드 (필수)**

```bash
cd packages/core && pnpm build
```

---

## 디버깅 과정에서 배운 것

### 시도한 가설 (모두 잘못된 방향이었음)

1. `opts$.get()` deep 추적 → double dep 등록
2. Pre-cached child refs가 parent traversal 방지
3. Legend-State v3 beta의 deep tracking 변화
4. React Strict Mode double-mount에서 subscription 중복
5. `normalizeTargets` 내부의 추가 dep 등록

### 실제 재현 경로

`packages/core/src/primitives/useScope/_debug.spec.ts`에서 동일 패턴 테스트 → 통과
`packages/web/src/elements/useIntersectionObserver/_debug.spec.ts`에서 동일 패턴 테스트 → 실패

동일 로직이 core에서는 통과하는데 web에서는 실패 → 즉시 **모듈 해석 차이** 의심했어야 했다.

**교훈**: web 테스트와 core 테스트 결과가 같은 로직에 대해 불일치할 때, 먼저 dist 재빌드부터.

---

## 관련 파일

```
packages/core/src/primitives/useScope/reactiveProps.ts   ← subscribeObsField
packages/core/src/primitives/useScope/observe.ts         ← 변경 없음
packages/core/src/primitives/useScope/observable.spec.ts ← 새 테스트 추가
packages/core/dist/                                      ← 재빌드 필요
packages/web/src/elements/useIntersectionObserver/core.ts
packages/web/src/elements/useIntersectionObserver/index.ts
```
