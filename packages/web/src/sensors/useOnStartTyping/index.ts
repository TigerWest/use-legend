"use client";
import { useConstant } from "@usels/core/shared/useConstant";
import { useLatest } from "@usels/core/shared/useLatest";
import { defaultDocument } from "@shared/configurable";
import { useEventListener } from "@browser/useEventListener";

const editableTypes = new Set([
  "text",
  "password",
  "email",
  "number",
  "search",
  "tel",
  "url",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
]);

function isFocusedElementEditable(doc: Document): boolean {
  const el = doc.activeElement;
  if (!el) return false;

  if (el instanceof HTMLInputElement) {
    return editableTypes.has(el.type);
  }

  if (el instanceof HTMLTextAreaElement) return true;

  return (
    (el as HTMLElement).isContentEditable === true || (el as HTMLElement).contentEditable === "true"
  );
}

function isTypedCharValid(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (event.key.length === 1) return true;
  return false;
}

export function useOnStartTyping(callback: (event: KeyboardEvent) => void): void {
  const callbackRef = useLatest(callback);

  const listener = useConstant(() => (event: KeyboardEvent) => {
    const doc = (event.currentTarget as Document) ?? defaultDocument;
    if (doc && !isFocusedElementEditable(doc) && isTypedCharValid(event)) {
      callbackRef.current(event);
    }
  });

  useEventListener(defaultDocument, "keydown", listener, { passive: true });
}
