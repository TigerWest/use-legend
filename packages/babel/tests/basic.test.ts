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
  title: 'basic transforms',
  tests: {
    'wraps $-suffixed observable .get() in JSX child': {
      code: `
        function App() {
          return <div>{count$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => count$.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps chained .get() (user$.profile.name.get())': {
      code: `
        function App() {
          return <span>{user$.profile.name.get()}</span>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <span>
              <Memo>{() => user$.profile.name.get()}</Memo>
            </span>
          );
        }
      `,
    },

    'wraps complex expression with multiple .get() in one Auto': {
      code: `
        function App() {
          return <p>{a$.get() + " " + b$.get()}</p>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <p>
              <Memo>{() => a$.get() + " " + b$.get()}</Memo>
            </p>
          );
        }
      `,
    },

    'wraps ternary containing .get()': {
      code: `
        function App() {
          return <div>{isActive$.get() ? "ON" : "OFF"}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => (isActive$.get() ? "ON" : "OFF")}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps logical AND conditional rendering': {
      code: `
        function App() {
          return <div>{show$.get() && <Modal />}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => show$.get() && <Modal />}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps JSX-containing expression (ternary with JSX)': {
      code: `
        function App() {
          return <div>{isVisible$.get() ? <A /> : <B />}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => (isVisible$.get() ? <A /> : <B />)}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps span child that contains .get()': {
      code: `
        function App() {
          return <div><span>{name$.get()}</span><p>static</p></div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <span>
                <Memo>{() => name$.get()}</Memo>
              </span>
              <p>static</p>
            </div>
          );
        }
      `,
    },

    'does not add import if already present': {
      code: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return <div>{count$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => count$.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'does not add import when no transforms occur': {
      code: `
        function App() {
          return <div>hello world</div>;
        }
      `,
    },

    'does not transform JSX without .get()': {
      code: `
        function App() {
          return <div>{someValue}</div>;
        }
      `,
    },

    'does not transform non-JSX .get()': {
      code: `const x = count$.get();`,
    },
  },
});
