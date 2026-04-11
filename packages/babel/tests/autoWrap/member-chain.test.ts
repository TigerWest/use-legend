import pluginTester from 'babel-plugin-tester';
import plugin from '../../src';

const babelOptions = {
  plugins: ['@babel/plugin-syntax-jsx'],
  configFile: false,
  babelrc: false,
};

pluginTester({
  plugin,
  pluginOptions: {},
  babelOptions,
  title: 'member-chain $ detection',
  tests: {
    'wraps drag.x$.get() where only a mid-chain segment ends in $': {
      code: `
        function App() {
          return <div>{drag.x$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => drag.x$.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps deeply-nested drag.nested.x$.get()': {
      code: `
        function App() {
          return <div>{drag.nested.x$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => drag.nested.x$.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps drag.x$?.get() optional call with mid-chain $': {
      code: `
        function App() {
          return <div>{drag.x$?.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => drag.x$?.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps items[0].x$.get() where computed root is non-$': {
      code: `
        function App() {
          return <div>{items[0].x$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => items[0].x$.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'does NOT wrap plain.value.get() with no $ anywhere': {
      code: `
        function App() {
          return <div>{plain.value.get()}</div>;
        }
      `,
    },

    'wraps obs$.get() (regression — root $)': {
      code: `
        function App() {
          return <div>{obs$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => obs$.get()}</Memo>
            </div>
          );
        }
      `,
    },
  },
});
