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
  title: 'complex use cases',
  tests: {
    'wraps three independent reactive siblings with separate Memos': {
      code: `
        function App() {
          return (
            <div>
              {a$.get()}
              {b$.get()}
              {c$.get()}
            </div>
          );
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => a$.get()}</Memo>
              <Memo>{() => b$.get()}</Memo>
              <Memo>{() => c$.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps nullish coalescing expression containing .get()': {
      code: `
        function App() {
          return <p>{name$.get() ?? 'Anonymous'}</p>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <p>
              <Memo>{() => name$.get() ?? "Anonymous"}</Memo>
            </p>
          );
        }
      `,
    },

    'wraps function call with .get() as argument': {
      code: `
        function App() {
          return <p>{formatDate(date$.get())}</p>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <p>
              <Memo>{() => formatDate(date$.get())}</Memo>
            </p>
          );
        }
      `,
    },

    'wraps .get() inside 3-level nested JSX': {
      code: `
        function App() {
          return (
            <div>
              <section>
                <p>{content$.get()}</p>
              </section>
            </div>
          );
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <section>
                <p>
                  <Memo>{() => content$.get()}</Memo>
                </p>
              </section>
            </div>
          );
        }
      `,
    },

    'wraps reactive expression and reactive-attribute sibling independently': {
      code: `
        function App() {
          return (
            <div>
              {count$.get()}
              <span className={color$.get()}>{label$.get()}</span>
            </div>
          );
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => count$.get()}</Memo>
              <Memo>{() => <span className={color$.get()}>{label$.get()}</span>}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps .get() in arrow function component body': {
      code: `
        const App = () => (
          <div>{value$.get()}</div>
        );
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        const App = () => (
          <div>
            <Memo>{() => value$.get()}</Memo>
          </div>
        );
      `,
    },

    'wraps logical OR fallback expression with .get()': {
      code: `
        function App() {
          return <p>{user$.name.get() || 'Guest'}</p>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <p>
              <Memo>{() => user$.name.get() || "Guest"}</Memo>
            </p>
          );
        }
      `,
    },

    'wraps .map() items that have reactive attribute and content': {
      code: `
        function App() {
          return (
            <ul>
              {items.map((item$) => (
                <li className={item$.class.get()}>{item$.name.get()}</li>
              ))}
            </ul>
          );
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <ul>
              {items.map((item$) => (
                <Memo>{() => <li className={item$.class.get()}>{item$.name.get()}</li>}</Memo>
              ))}
            </ul>
          );
        }
      `,
    },
  },
});
