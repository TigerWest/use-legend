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
  title: 'autoScope props behavior',
  tests: {
    'props not referenced in scope body: transforms normally': {
      code: `
        function MyComponent({ title }) {
          "use scope"
          const count$ = createObservable(0)
          return <div>{title}: {count$.get()}</div>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent({ title }) {
          const { count$ } = useScope(() => {
            const count$ = createObservable(0);
            return {
              count$,
            };
          });
          return (
            <div>
              {title}: {count$.get()}
            </div>
          );
        }
      `,
    },

    'props not used at all: transforms normally': {
      code: `
        function MyComponent(props) {
          "use scope"
          const x$ = createObservable(0)
          return <div>{x$.get()}</div>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent(props) {
          const { x$ } = useScope(() => {
            const x$ = createObservable(0);
            return {
              x$,
            };
          });
          return <div>{x$.get()}</div>;
        }
      `,
    },

    'props passed to child in return JSX: transforms normally': {
      code: `
        function MyComponent({ items }) {
          "use scope"
          const selected$ = createObservable(null)
          return <List items={items} selected$={selected$} />
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent({ items }) {
          const { selected$ } = useScope(() => {
            const selected$ = createObservable(null);
            return {
              selected$,
            };
          });
          return <List items={items} selected$={selected$} />;
        }
      `,
    },

    'no props: transforms normally': {
      code: `
        function MyComponent() {
          "use scope"
          const value$ = createObservable("hello")
          return <div>{value$.get()}</div>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function MyComponent() {
          const { value$ } = useScope(() => {
            const value$ = createObservable("hello");
            return {
              value$,
            };
          });
          return <div>{value$.get()}</div>;
        }
      `,
    },

    'Test 1 — destructured prop used in scope body': {
      code: `
        function C({ count }) {
          "use scope"
          const d = count * 2
          return <i>{d}</i>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ count }) {
          const { d } = useScope(
            (p) => {
              const d = p.count * 2;
              return {
                d,
              };
            },
            {
              count,
            }
          );
          return <i>{d}</i>;
        }
      `,
    },

    'Test 2 — multiple destructured props, mix of scope-body and JSX usage': {
      code: `
        function C({ count, title }) {
          "use scope"
          const doubled = count * 2
          return <div>{title}: {doubled}</div>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ count, title }) {
          const { doubled } = useScope(
            (p) => {
              const doubled = p.count * 2;
              return {
                doubled,
              };
            },
            {
              count,
              title,
            }
          );
          return (
            <div>
              {title}: {doubled}
            </div>
          );
        }
      `,
    },

    'Test 3 — destructured alias': {
      code: `
        function C({ count: cnt }) {
          "use scope"
          const d = cnt + 1
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ count: cnt }) {
          const { d } = useScope(
            (p) => {
              const d = p.count + 1;
              return {
                d,
              };
            },
            {
              count: cnt,
            }
          );
          return null;
        }
      `,
    },

    'Test 4 — identifier param with member access': {
      code: `
        function C(props) {
          "use scope"
          const d = props.count * 2
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C(props) {
          const { d } = useScope((p) => {
            const d = p.count * 2;
            return {
              d,
            };
          }, props);
          return null;
        }
      `,
    },

    'Test 5 — identifier param used bare inside observe': {
      code: `
        function C(props) {
          "use scope"
          observe(() => console.log(props))
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C(props) {
          useScope((p) => {
            observe(() => console.log(p));
          }, props);
          return null;
        }
      `,
    },

    'Test 6 — shadowing inside nested closure (param NOT referenced in factory body)': {
      code: `
        function C({ count }) {
          "use scope"
          const fn = () => {
            const count = 10
            return count
          }
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ count }) {
          const { fn } = useScope(() => {
            const fn = () => {
              const count = 10;
              return count;
            };
            return {
              fn,
            };
          });
          return null;
        }
      `,
    },

    'Test 7 — observe in bare call with props rewrite': {
      code: `
        function C({ title }) {
          "use scope"
          observe(() => console.log(title))
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ title }) {
          useScope(
            (p) => {
              observe(() => console.log(p.title));
            },
            {
              title,
            }
          );
          return null;
        }
      `,
    },

    'Test 8 — partial use with closure shadowing': {
      code: `
        function C({ count, title }) {
          "use scope"
          const fn = () => {
            const count = 0
            return count
          }
          observe(() => console.log(title))
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ count, title }) {
          const { fn } = useScope(
            (p) => {
              const fn = () => {
                const count = 0;
                return count;
              };
              observe(() => console.log(p.title));
              return {
                fn,
              };
            },
            {
              count,
              title,
            }
          );
          return null;
        }
      `,
    },

    'Test 9 — factory param fallback when user local p collides': {
      code: `
        function C({ count }) {
          "use scope"
          const p = "hello"
          const d = count * 2
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ count }) {
          const { p, d } = useScope(
            (_p) => {
              const p = "hello";
              const d = _p.count * 2;
              return {
                p,
                d,
              };
            },
            {
              count,
            }
          );
          return null;
        }
      `,
    },

    'computed member access rewrites; non-computed property does not': {
      code: `
        function C({ count }) {
          "use scope"
          const a = obj[count]
          const b = obj.count
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ count }) {
          const { a, b } = useScope(
            (p) => {
              const a = obj[p.count];
              const b = obj.count;
              return {
                a,
                b,
              };
            },
            {
              count,
            }
          );
          return null;
        }
      `,
    },

    'computed object key rewrites; literal key does not': {
      code: `
        function C({ count }) {
          "use scope"
          const d = { [count]: 1, count: 2 }
          return null
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ count }) {
          const { d } = useScope(
            (p) => {
              const d = {
                [p.count]: 1,
                count: 2,
              };
              return {
                d,
              };
            },
            {
              count,
            }
          );
          return null;
        }
      `,
    },

    'prop referenced inside JSX expression in scope body declaration': {
      code: `
        function C({ label }) {
          "use scope"
          const node = <span>{label}</span>
          return node
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ label }) {
          const { node } = useScope(
            (p) => {
              const node = <span>{p.label}</span>;
              return {
                node,
              };
            },
            {
              label,
            }
          );
          return node;
        }
      `,
    },

    'multi-param hook: both params used': {
      code: `
        function useHook({ count }, { step }) {
          "use scope"
          const result$ = obs(count + step)
          return { result$ }
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function useHook({ count }, { step }) {
          return useScope(
            (p0, p1) => {
              const result$ = obs(p0.count + p1.step);
              return {
                result$,
              };
            },
            {
              count,
            },
            {
              step,
            }
          );
        }
      `,
    },

    'multi-param hook: only second param used': {
      code: `
        function useHook(ignored, { step }) {
          "use scope"
          const r$ = obs(step)
          return { r$ }
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function useHook(ignored, { step }) {
          return useScope(
            (p1) => {
              const r$ = obs(p1.step);
              return {
                r$,
              };
            },
            {
              step,
            }
          );
        }
      `,
    },

    'multi-param hook: identifier param used in body': {
      code: `
        function useHook(props, { step }) {
          "use scope"
          const r$ = obs(props.count + step)
          return { r$ }
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function useHook(props, { step }) {
          return useScope(
            (p0, p1) => {
              const r$ = obs(p0.count + p1.step);
              return {
                r$,
              };
            },
            props,
            {
              step,
            }
          );
        }
      `,
    },

    'multi-param component: both params used': {
      code: `
        function Comp({ title }, { theme }) {
          "use scope"
          const styled$ = obs(title + theme)
          return <div>{styled$.get()}</div>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function Comp({ title }, { theme }) {
          const { styled$ } = useScope(
            (p0, p1) => {
              const styled$ = obs(p0.title + p1.theme);
              return {
                styled$,
              };
            },
            {
              title,
            },
            {
              theme,
            }
          );
          return <div>{styled$.get()}</div>;
        }
      `,
    },
  },
});
