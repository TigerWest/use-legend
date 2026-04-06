export interface AutoScopeOptions {
  /** Import source for useScope (default: "@usels/core") */
  importSource?: string;
}

export interface AutoScopeState {
  opts: AutoScopeOptions;
  useScopeImportNeeded: boolean;
  useScopeImportSource: string;
}
