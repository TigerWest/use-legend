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
  title: 'JSX attribute transforms',
  tests: {
    'wraps element with single attribute .get()': {
      code: `
        function App() {
          return <Component value={obs$.get()} />;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return <Memo>{() => <Component value={obs$.get()} />}</Memo>;
        }
      `,
    },

    'wraps self-closing element with attribute .get()': {
      code: `
        function App() {
          return <Input disabled={isDisabled$.get()} />;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return <Memo>{() => <Input disabled={isDisabled$.get()} />}</Memo>;
        }
      `,
    },

    'wraps element with multiple attribute .get() into single Auto': {
      code: `
        function App() {
          return <Component value={obs$.get()} label={name$.get()} />;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <Memo>{() => <Component value={obs$.get()} label={name$.get()} />}</Memo>
          );
        }
      `,
    },

    'wraps entire element when both attribute and children have .get()': {
      code: `
        function App() {
          return <div className={theme$.get()}>{count$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <Memo>{() => <div className={theme$.get()}>{count$.get()}</div>}</Memo>
          );
        }
      `,
    },

    'wraps element with spread attribute containing .get()': {
      code: `
        function App() {
          return <Component {...obs$.get()} />;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return <Memo>{() => <Component {...obs$.get()} />}</Memo>;
        }
      `,
    },

    'does NOT wrap element with only key={obs$.get()}': {
      code: `
        function App() {
          return <li key={item$.id.get()}>content</li>;
        }
      `,
    },

    'does NOT wrap element with only ref={obs$.get()}': {
      code: `
        function App() {
          return <div ref={domRef$.get()}>content</div>;
        }
      `,
    },

    'wraps element when key + other attribute both have .get()': {
      code: `
        function App() {
          return <li key={item$.id.get()} className={theme$.get()}>content</li>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <Memo>
              {() => (
                <li key={item$.id.get()} className={theme$.get()}>
                  content
                </li>
              )}
            </Memo>
          );
        }
      `,
    },

    'does NOT wrap element when attribute has .get() with args (Map.get)': {
      code: `
        function App() {
          return <Component value={map.get("key")} />;
        }
      `,
    },
  },
});
