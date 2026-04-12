import { defaultDocument } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

// ---------------------------------------------------------------------------
// Helpers — pure functions, no React or Legend-State dependencies
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Callback fired when the user starts typing on a non-editable element. */
export type OnStartTypingCallback = (event: KeyboardEvent) => void;

// ---------------------------------------------------------------------------
// Core (framework-agnostic)
// ---------------------------------------------------------------------------

/**
 * Framework-agnostic "start typing" detector.
 *
 * Registers a `keydown` listener on `document` and fires `onStart` when the
 * user presses a typeable key while no editable element (input, textarea,
 * contenteditable) is focused.
 *
 * Must be called inside a `useScope` factory so that `createEventListener`
 * and cleanup are bound to the correct scope.
 */
export function createOnStartTyping(onStart: OnStartTypingCallback): void {
  const listener = (event: KeyboardEvent) => {
    const doc = (event.currentTarget as Document) ?? defaultDocument;
    if (doc && !isFocusedElementEditable(doc) && isTypedCharValid(event)) {
      onStart(event);
    }
  };

  createEventListener(defaultDocument, "keydown", listener, { passive: true });
}
