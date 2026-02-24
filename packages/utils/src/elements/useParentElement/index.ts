import type { Observable, OpaqueObject } from "@legendapp/state";
import { opaqueObject } from "@legendapp/state";
import { useMount, useObservable, useObserve } from "@legendapp/state/react";
import { getElement } from "../useEl$";
import type { MaybeElement } from "../useEl$";

export function useParentElement(
  element?: MaybeElement,
): Observable<OpaqueObject<HTMLElement | SVGElement> | null> {
  const parent$ = useObservable<OpaqueObject<HTMLElement | SVGElement> | null>(
    null,
  );

  /**
   * NOTE: plain element (non-Observable, non-El$)을 전달한 경우,
   * 해당 요소가 DOM 내에서 다른 부모로 이동하더라도 자동으로 갱신되지 않습니다.
   * 동적 감지가 필요하면 El$ 또는 Observable<Element>를 사용하세요.
   */
  const update = () => {
    if (!element) return;
    const el = getElement(element as MaybeElement);
    // Document / Window 는 parentElement 프로퍼티가 없으므로 null → SSR-safe
    const parent = (el as HTMLElement | null)?.parentElement ?? null;
    parent$.set(
      parent
        ? opaqueObject(parent as unknown as HTMLElement | SVGElement)
        : null,
    );
  };

  useMount(update);
  useObserve(update, { immediate: false });

  return parent$;
}
