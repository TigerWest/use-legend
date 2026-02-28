import pluginTester from 'babel-plugin-tester';
import plugin from '../src';

const babelOptions = {
  plugins: ['@babel/plugin-syntax-jsx'],
  configFile: false,
  babelrc: false,
};

pluginTester({
  plugin,
  pluginOptions: {},
  babelOptions,
  title: 'reactive children auto-wrapping (Memo / Show / Computed)',
  tests: {
    // --- Basic wrapping ---

    'wraps Memo children in () => arrow function': {
      code: `
        function App() {
          return <Memo>{count$.get()}</Memo>;
        }
      `,
      output: `
        function App() {
          return <Memo>{() => count$.get()}</Memo>;
        }
      `,
    },

    'wraps Show children in () => arrow function': {
      code: `
        function App() {
          return <Show if={cond$}>{count$.get()}</Show>;
        }
      `,
      output: `
        function App() {
          return <Show if={cond$}>{() => count$.get()}</Show>;
        }
      `,
    },

    'wraps Computed children in () => arrow function': {
      code: `
        function App() {
          return <Computed>{count$.get()}</Computed>;
        }
      `,
      output: `
        function App() {
          return <Computed>{() => count$.get()}</Computed>;
        }
      `,
    },

    // --- Skip cases (children already function / reference) ---

    'does NOT re-wrap already arrow function children': {
      code: `
        function App() {
          return <Memo>{() => count$.get()}</Memo>;
        }
      `,
    },

    'does NOT wrap Identifier children (already a reference)': {
      code: `
        function App() {
          return <Memo>{renderFn}</Memo>;
        }
      `,
    },

    'does NOT wrap MemberExpression children (already a reference)': {
      code: `
        function App() {
          return <Memo>{obj.render}</Memo>;
        }
      `,
    },

    'does NOT wrap FunctionExpression children': {
      code: `
        function App() {
          return <Memo>{function() { return count$.get(); }}</Memo>;
        }
      `,
      output: `
        function App() {
          return (
            <Memo>
              {function () {
                return count$.get();
              }}
            </Memo>
          );
        }
      `,
    },

    // --- Direct JSX element child ---

    'wraps direct JSX element child in arrow function': {
      code: `
        function App() {
          return <Memo><div>hello</div></Memo>;
        }
      `,
      output: `
        function App() {
          return <Memo>{() => <div>hello</div>}</Memo>;
        }
      `,
    },

    'wraps direct JSX element with .get() inside': {
      code: `
        function App() {
          return <Memo><span>{count$.get()}</span></Memo>;
        }
      `,
      output: `
        function App() {
          return <Memo>{() => <span>{count$.get()}</span>}</Memo>;
        }
      `,
    },

    // --- Multiple children → Fragment ---

    'wraps multiple children in Fragment arrow function': {
      code: `
        function App() {
          return <Memo><A /><B /></Memo>;
        }
      `,
      output: `
        function App() {
          return (
            <Memo>
              {() => (
                <>
                  <A />
                  <B />
                </>
              )}
            </Memo>
          );
        }
      `,
    },

    // --- Combined: children wrapping + attribute .get() → full Memo wrap ---

    'combined: Show with .get() attribute wraps children AND whole element in Memo': {
      code: `
        function App() {
          return <Show if={obs$.get()}>{count$.get()}</Show>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return <Memo>{() => <Show if={obs$.get()}>{() => count$.get()}</Show>}</Memo>;
        }
      `,
    },

    // --- Memo empty children → no transform ---

    'does NOT transform Memo with no children': {
      code: `
        function App() {
          return <Memo></Memo>;
        }
      `,
    },

    // --- Nested complex expression ---

    'wraps Show children that contain complex expression': {
      code: `
        function App() {
          return <Show if={cond$}>{a$.get() + b$.get()}</Show>;
        }
      `,
      output: `
        function App() {
          return <Show if={cond$}>{() => a$.get() + b$.get()}</Show>;
        }
      `,
    },
  },
});

// --- wrapReactiveChildren: false ---

pluginTester({
  plugin,
  pluginOptions: { wrapReactiveChildren: false },
  babelOptions,
  title: 'wrapReactiveChildren: false — disables auto-wrapping',
  tests: {
    'does NOT wrap Memo children when feature is disabled': {
      code: `
        function App() {
          return <Memo>{count$.get()}</Memo>;
        }
      `,
    },

    'does NOT wrap Show children when feature is disabled': {
      code: `
        function App() {
          return <Show if={cond$}>{count$.get()}</Show>;
        }
      `,
    },

    'does NOT wrap Computed children when feature is disabled': {
      code: `
        function App() {
          return <Computed>{count$.get()}</Computed>;
        }
      `,
    },
  },
});

// --- wrapReactiveChildrenComponents: custom extension ---

pluginTester({
  plugin,
  pluginOptions: { wrapReactiveChildrenComponents: ['Custom'] },
  babelOptions,
  title: 'wrapReactiveChildrenComponents — extends default set',
  tests: {
    'wraps children of custom reactive component': {
      code: `
        function App() {
          return <Custom>{count$.get()}</Custom>;
        }
      `,
      output: `
        function App() {
          return <Custom>{() => count$.get()}</Custom>;
        }
      `,
    },

    'still wraps default Memo children alongside custom': {
      code: `
        function App() {
          return <Memo>{count$.get()}</Memo>;
        }
      `,
      output: `
        function App() {
          return <Memo>{() => count$.get()}</Memo>;
        }
      `,
    },
  },
});
