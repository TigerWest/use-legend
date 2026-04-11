import { observable, type Observable } from "@legendapp/state";
import { type DeepMaybeObservable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";
import { defaultNavigator } from "@shared/configurable";

export interface UseDropZoneOptions {
  dataTypes?: string[] | ((types: readonly string[]) => boolean);
  checkValidity?: (items: DataTransferItemList) => boolean;
  onDrop?: (files: File[] | null, event: DragEvent) => void;
  onEnter?: (files: File[] | null, event: DragEvent) => void;
  onLeave?: (files: File[] | null, event: DragEvent) => void;
  onOver?: (files: File[] | null, event: DragEvent) => void;
  multiple?: boolean;
  preventDefaultForUnhandled?: boolean;
}

export interface UseDropZoneReturn {
  files$: Observable<File[] | null>;
  isOverDropZone$: Observable<boolean>;
}

/**
 * Framework-agnostic file drop zone.
 *
 * Registers `dragenter` / `dragleave` / `dragover` / `drop` listeners on the
 * target via `createEventListener`, tracks drag-over state, and validates file
 * types before accepting drops. Must be called inside a `useScope` factory.
 */
export function createDropZone(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseDropZoneOptions>
): UseDropZoneReturn {
  const opts$ = observable(options);

  const files$ = observable<File[] | null>(null);
  const isOver$ = observable<boolean>(false);

  // Drag counter tracks enter/leave pairs so nested children do not flip state.
  let counter = 0;

  const isValidDrop = (event: DragEvent): boolean => {
    const items = event.dataTransfer?.items;
    if (!items) return false;

    // Safari detection: UA contains 'Safari' but not 'Chrome' (SSR guard required).
    const isSafari =
      defaultNavigator != null && /^((?!chrome|android).)*safari/i.test(defaultNavigator.userAgent);
    if (isSafari) return true;

    const o = opts$.peek();
    const checkValidity = o?.checkValidity;
    if (checkValidity) return checkValidity(items);

    const dataTypes = o?.dataTypes;
    if (dataTypes) {
      const types = Array.from(items).map((i) => i.type);
      if (typeof dataTypes === "function") return dataTypes(types);
      return dataTypes.some((t) => types.includes(t));
    }
    return true;
  };

  const getFiles = (event: DragEvent): File[] | null => {
    const fileList = Array.from(event.dataTransfer?.files ?? []);
    if (!fileList.length) return null;
    const multiple = opts$.peek()?.multiple;
    return multiple === false ? [fileList[0]] : fileList;
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    counter++;
    const valid = isValidDrop(e);
    if (valid) {
      e.dataTransfer!.dropEffect = "copy";
      isOver$.set(true);
      opts$.peek()?.onEnter?.(getFiles(e), e);
    } else {
      e.dataTransfer!.dropEffect = "none";
    }
  };

  const onDragLeave = (e: DragEvent) => {
    counter = Math.max(0, counter - 1);
    if (counter === 0) {
      isOver$.set(false);
      opts$.peek()?.onLeave?.(null, e);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (isValidDrop(e)) {
      e.dataTransfer!.dropEffect = "copy";
      opts$.peek()?.onOver?.(getFiles(e), e);
    } else {
      e.dataTransfer!.dropEffect = "none";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    counter = 0;
    isOver$.set(false);
    if (isValidDrop(e)) {
      const droppedFiles = getFiles(e);
      files$.set(droppedFiles);
      opts$.peek()?.onDrop?.(droppedFiles, e);
    } else {
      files$.set(null);
      opts$.peek()?.onDrop?.(null, e);
    }
  };

  createEventListener(target, "dragenter", onDragEnter);
  createEventListener(target, "dragleave", onDragLeave);
  createEventListener(target, "dragover", onDragOver);
  createEventListener(target, "drop", onDrop);

  return { files$, isOverDropZone$: isOver$ };
}
