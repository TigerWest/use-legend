import pluginTester from 'babel-plugin-tester';
import { autoScopePlugin } from '../../src/autoScope';

const babelOptions = {
  plugins: ['@babel/plugin-syntax-jsx'],
  configFile: false,
  babelrc: false,
};

pluginTester({
  plugin: autoScopePlugin,
  pluginOptions: {},
  babelOptions,
  title: 'autoScope transforms',
  tests: {
    'basic: VariableDeclarations + bare call go inside scope': {
      code: `
        function MyComponent() {
          "use scope"
          const count$ = createObservable(0)
          onMount(() => console.log("mounted"))
          return <div>{count$.get()}</div>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent() {
          const { count$ } = useScope(() => {
            const count$ = createObservable(0);
            onMount(() => console.log("mounted"));
            return {
              count$,
            };
          });
          return <div>{count$.get()}</div>;
        }
      `,
    },

    'no transform without directive': {
      code: `
        function MyComponent() {
          const count$ = createObservable(0)
          return <div>{count$.get()}</div>
        }
      `,
      output: `
        function MyComponent() {
          const count$ = createObservable(0);
          return <div>{count$.get()}</div>;
        }
      `,
    },

    'import injection: adds useScope import from @usels/core': {
      code: `
        function MyComponent() {
          "use scope"
          const x$ = createObservable(0)
          return <div />
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent() {
          const { x$ } = useScope(() => {
            const x$ = createObservable(0);
            return {
              x$,
            };
          });
          return <div />;
        }
      `,
    },

    'import merging: merges useScope into existing @usels/core import': {
      code: `
        import { observable } from "@usels/core"
        function MyComponent() {
          "use scope"
          const x$ = observable(0)
          return <div />
        }
      `,
      output: `
        import { observable, useScope } from "@usels/core";
        function MyComponent() {
          const { x$ } = useScope(() => {
            const x$ = observable(0);
            return {
              x$,
            };
          });
          return <div />;
        }
      `,
    },

    'useScope already imported: idempotent, no duplicate': {
      code: `
        import { useScope } from "@usels/core"
        function MyComponent() {
          "use scope"
          const x$ = createObservable(0)
          return <div />
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent() {
          const { x$ } = useScope(() => {
            const x$ = createObservable(0);
            return {
              x$,
            };
          });
          return <div />;
        }
      `,
    },

    'early return inside nested fn (allowed — function boundary)': {
      code: `
        function MyComponent() {
          "use scope"
          onMount(() => { return })
          return <div />
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent() {
          useScope(() => {
            onMount(() => {
              return;
            });
          });
          return <div />;
        }
      `,
    },

    'empty scope: directive only, no declarations': {
      code: `
        function MyComponent() {
          "use scope"
          return <div />
        }
      `,
      output: `
        function MyComponent() {
          return <div />;
        }
      `,
    },

    'arrow component transforms': {
      code: `
        const Comp = () => {
          "use scope"
          const x$ = createObservable(0)
          return <div>{x$.get()}</div>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        const Comp = () => {
          const { x$ } = useScope(() => {
            const x$ = createObservable(0);
            return {
              x$,
            };
          });
          return <div>{x$.get()}</div>;
        };
      `,
    },

    'concise arrow (no BlockStatement) is NOT transformed': {
      code: `const Comp = () => <div />`,
      output: `const Comp = () => <div />;`,
    },

    'plain value goes inside scope and into return': {
      code: `
        function MyComponent() {
          "use scope"
          const title = "hello"
          return <div>{title}</div>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent() {
          const { title } = useScope(() => {
            const title = "hello";
            return {
              title,
            };
          });
          return <div>{title}</div>;
        }
      `,
    },

    'object destructuring: both bindings in return': {
      code: `
        function MyComponent() {
          "use scope"
          const { a, b } = obj
          return <div />
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent() {
          const { a, b } = useScope(() => {
            const { a, b } = obj;
            return {
              a,
              b,
            };
          });
          return <div />;
        }
      `,
    },

    'array destructuring: both bindings in return': {
      code: `
        function MyComponent() {
          "use scope"
          const [x, y] = arr
          return <div />
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent() {
          const { x, y } = useScope(() => {
            const [x, y] = arr;
            return {
              x,
              y,
            };
          });
          return <div />;
        }
      `,
    },

    'no-binding bare calls only: expression statement, no destructure': {
      code: `
        function MyComponent() {
          "use scope"
          onMount(() => console.log("hi"))
          return <div />
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent() {
          useScope(() => {
            onMount(() => console.log("hi"));
          });
          return <div />;
        }
      `,
    },

    'custom importSource option': {
      pluginOptions: { importSource: '@my/custom' },
      code: `
        function MyComponent() {
          "use scope"
          const x$ = createObservable(0)
          return <div />
        }
      `,
      output: `
        import { useScope } from "@my/custom";
        function MyComponent() {
          const { x$ } = useScope(() => {
            const x$ = createObservable(0);
            return {
              x$,
            };
          });
          return <div />;
        }
      `,
    },

    '"use scope" as ExpressionStatement (mid-body) does not transform': {
      code: `
        function C() {
          const a = 1
          "use scope"
          const b$ = createObservable(0)
          return null
        }
      `,
      output: `
        function C() {
          const a = 1;
          ("use scope");
          const b$ = createObservable(0);
          return null;
        }
      `,
    },

    '"use strict" and "use scope" coexist: strict preserved, transform runs': {
      code: `
        function C() {
          "use strict"
          "use scope"
          const x$ = createObservable(0)
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C() {
          "use strict";

          const { x$ } = useScope(() => {
            const x$ = createObservable(0);
            return {
              x$,
            };
          });
          return null;
        }
      `,
    },

    '"use-scope" (hyphenated) does not transform': {
      code: `
        function C() {
          "use-scope"
          const x$ = createObservable(0)
          return null
        }
      `,
      output: `
        function C() {
          "use-scope";

          const x$ = createObservable(0);
          return null;
        }
      `,
    },

    'type-only import from importSource: adds separate runtime import': {
      babelOptions: {
        parserOpts: { plugins: ['typescript'] },
        configFile: false,
        babelrc: false,
      },
      code: `
        import type { Foo } from "@usels/core"
        function C() {
          "use scope"
          const x$ = createObservable(0)
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        import type { Foo } from "@usels/core";
        function C() {
          const { x$ } = useScope(() => {
            const x$ = createObservable(0);
            return {
              x$,
            };
          });
          return null;
        }
      `,
    },

    'hook: wraps entire body in return useScope': {
      code: `
        function useCounter() {
          "use scope"
          const count$ = createObservable(0)
          return { count$ }
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function useCounter() {
          return useScope(() => {
            const count$ = createObservable(0);
            return {
              count$,
            };
          });
        }
      `,
    },

    'hook: bare calls only, no return': {
      code: `
        function useSetup() {
          "use scope"
          onMount(() => console.log("hi"))
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function useSetup() {
          return useScope(() => {
            onMount(() => console.log("hi"));
          });
        }
      `,
    },

    'hook: arrow function assigned to useX variable': {
      code: `
        const useCounter = () => {
          "use scope"
          const count$ = createObservable(0)
          return { count$ }
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        const useCounter = () => {
          return useScope(() => {
            const count$ = createObservable(0);
            return {
              count$,
            };
          });
        };
      `,
    },

    'hook: props forwarded as second arg': {
      code: `
        function useCounter({ initial }) {
          "use scope"
          const count$ = createObservable(initial)
          return { count$ }
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function useCounter({ initial }) {
          return useScope(
            (p) => {
              const count$ = createObservable(p.initial);
              return {
                count$,
              };
            },
            {
              initial,
            }
          );
        }
      `,
    },

    'hook: empty scope (directive only)': {
      code: `
        function useEmpty() {
          "use scope"
        }
      `,
      output: `
        function useEmpty() {}
      `,
    },

    'use without uppercase letter is not a hook (treated as component)': {
      code: `
        function usecase() {
          "use scope"
          const x$ = createObservable(0)
          return <div />
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function usecase() {
          const { x$ } = useScope(() => {
            const x$ = createObservable(0);
            return {
              x$,
            };
          });
          return <div />;
        }
      `,
    },

    'namespace import from importSource: adds separate named import': {
      code: `
        import * as Core from "@usels/core"
        function C() {
          "use scope"
          const x$ = createObservable(0)
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        import * as Core from "@usels/core";
        function C() {
          const { x$ } = useScope(() => {
            const x$ = createObservable(0);
            return {
              x$,
            };
          });
          return null;
        }
      `,
    },
  },
});
