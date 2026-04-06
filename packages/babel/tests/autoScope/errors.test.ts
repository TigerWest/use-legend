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
  title: 'autoScope compile errors',
  tests: {
    'early return inside scope body throws compile error': {
      code: `
        function MyComponent() {
          "use scope"
          if (!x) return null
          return <div />
        }
      `,
      throws: /Early return/,
    },

    'rest-spread prop referenced in scope body throws compile error': {
      code: `
        function C({ a, ...rest }) {
          "use scope"
          const x = a + rest.b
          return null
        }
      `,
      throws: /rest-spread prop "rest"/,
    },

    'nested destructured prop referenced in scope body throws compile error': {
      code: `
        function C({ a: { b } }) {
          "use scope"
          const x = b + 1
          return null
        }
      `,
      throws: /nested destructured prop "b"/,
    },

    'early return inside try block throws compile error': {
      code: `
        function C() {
          "use scope"
          try {
            return null
          } catch(e) {}
          return <div />
        }
      `,
      throws: /Early return/,
    },

    'early return inside while loop throws compile error': {
      code: `
        function C() {
          "use scope"
          while (x) {
            return null
          }
          return <div />
        }
      `,
      throws: /Early return/,
    },

    'early return inside for loop throws compile error': {
      code: `
        function C() {
          "use scope"
          for (let i = 0; i < 10; i++) {
            return null
          }
          return <div />
        }
      `,
      throws: /Early return/,
    },

    'rest-spread prop not referenced in scope body: no error': {
      code: `
        function C({ a, ...rest }) {
          "use scope"
          const d = a + 1
          return <Child rest={rest} />
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ a, ...rest }) {
          const { d } = useScope(
            (p) => {
              const d = p.a + 1;
              return {
                d,
              };
            },
            {
              a,
            }
          );
          return <Child rest={rest} />;
        }
      `,
    },

    'nested destructured prop not referenced in scope body: no error': {
      code: `
        function C({ a: { b } }) {
          "use scope"
          const d = 42
          return <span>{b}</span>
        }
      `,
      output: `
        import { useScope } from "@usels/core";
        function C({ a: { b } }) {
          const { d } = useScope(() => {
            const d = 42;
            return {
              d,
            };
          });
          return <span>{b}</span>;
        }
      `,
    },
  },
});
