export interface PluginOptions {
  /** Wrapper component name (default: "Memo") */
  componentName?: string;
  /** Import source (default: "@usels/core") */
  importSource?: string;
  /** If true, detect all .get() calls regardless of $ suffix (default: false) */
  allGet?: boolean;
  /** Additional method names to detect (default: ["get"]) */
  methodNames?: string[];
  /** Additional component names to treat as user-authored opaque reactive boundaries */
  reactiveComponents?: string[];
  /** Observer HOC function names (default: ["observer"]) */
  observerNames?: string[];
  /**
   * Auto-wrap non-function children of Memo/Show/Computed in () => (default: true)
   * Equivalent to @legendapp/state/babel plugin behavior.
   * Set to false to disable.
   */
  wrapReactiveChildren?: boolean;
  /**
   * Additional component names whose children should be auto-wrapped as () =>
   * Merged with defaults: ['Memo', 'Show', 'Computed']
   */
  wrapReactiveChildrenComponents?: string[];
}

export interface PluginState {
  autoImportNeeded: boolean;
  autoImportSource: string;
  autoComponentName: string;
  reactiveComponents: Set<string>;
  observerNames: Set<string>;
  autoWrapChildrenComponents: Set<string>;
  generatedMemoSources: WeakMap<import("@babel/types").JSXElement, Set<string>>;
  opts: PluginOptions;
}
