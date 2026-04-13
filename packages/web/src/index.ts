export * from "./types";

export {
  ObservablePersistLocalStorage,
  ObservablePersistSessionStorage,
} from "@legendapp/state/persist-plugins/local-storage";
export {
  ObservablePersistIndexedDB,
  observablePersistIndexedDB,
} from "@legendapp/state/persist-plugins/indexeddb";

// Browser
export * from "./browser/useEventListener";
export * from "./browser/useMediaQuery";
export * from "./browser/useAnimate";
export * from "./browser/usePreferredDark";
export * from "./browser/usePreferredColorScheme";
export * from "./browser/usePreferredContrast";
export * from "./browser/usePreferredReducedMotion";
export * from "./browser/usePreferredReducedTransparency";
export * from "./browser/usePreferredLanguages";
export * from "./browser/useLocalStorage";
export * from "./browser/useSessionStorage";
export * from "./browser/useScreenOrientation";
export * from "./browser/useCssVar";
export * from "./browser/useScriptTag";
export * from "./browser/useStyleTag";

// Elements
export * from "./elements/useResizeObserver";
export * from "./elements/useElementSize";
export * from "./elements/useElementBounding";
export * from "./elements/useMutationObserver";
export * from "./elements/useIntersectionObserver";
export * from "./elements/useElementVisibility";
export * from "./elements/useDocumentVisibility";
export * from "./elements/useWindowFocus";
export * from "./elements/useWindowSize";
export * from "./elements/useParentElement";
export * from "./elements/useMouseInElement";
export * from "./elements/useDraggable";
export * from "./elements/useDropZone";

// Sensors
export * from "./sensors/useMouse";
export * from "./sensors/useMousePressed";
export * from "./sensors/useScroll";
export * from "./sensors/useScrollLock";
export * from "./sensors/useInfiniteScroll";
export * from "./sensors/useWindowScroll";
export * from "./sensors/useNetwork";
export * from "./sensors/useOnline";
export * from "./sensors/useFocus";
export * from "./sensors/useFocusWithin";
export * from "./sensors/useOnClickOutside";
export * from "./sensors/useOnLongPress";
export * from "./sensors/useDeviceMotion";
export * from "./sensors/useDeviceOrientation";
export * from "./sensors/useDevicePixelRatio";
export * from "./sensors/useDevicesList";
export * from "./sensors/useElementByPoint";
export * from "./sensors/useElementHover";
export * from "./sensors/useDisplayMedia";
export * from "./sensors/useIdle";
export * from "./sensors/useGeolocation";
export * from "./sensors/useBattery";
export * from "./sensors/useUserMedia";

export * from "./sensors/useTextSelection";
export * from "./sensors/usePageLeave";
export * from "./sensors/useNavigatorLanguage";
export * from "./sensors/useSpeechRecognition";
export * from "./sensors/useSpeechSynthesis";
export * from "./sensors/useOnElementRemoval";

export * from "./sensors/useMagicKeys";
export * from "./sensors/useKeyModifier";
export * from "./sensors/useOnKeyStroke";
export * from "./sensors/useOnStartTyping";
export * from "./sensors/usePointer";
export * from "./sensors/usePointerLock";
export * from "./sensors/useParallax";
export * from "./sensors/usePointerSwipe";
export * from "./sensors/useSwipe";
