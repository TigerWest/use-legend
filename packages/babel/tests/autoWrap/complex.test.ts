import pluginTester from "babel-plugin-tester";
import plugin from "../../src";

const babelOptions = {
  plugins: ["@babel/plugin-syntax-jsx"],
  configFile: false,
  babelrc: false,
};

pluginTester({
  plugin,
  pluginOptions: {},
  babelOptions,
  title: "complex use cases",
  tests: {
    "wraps three independent reactive siblings with separate Memos": {
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
        import { Memo } from "@usels/core";
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

    "wraps nullish coalescing expression containing .get()": {
      code: `
        function App() {
          return <p>{name$.get() ?? 'Anonymous'}</p>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <p>
              <Memo>{() => name$.get() ?? "Anonymous"}</Memo>
            </p>
          );
        }
      `,
    },

    "wraps function call with .get() as argument": {
      code: `
        function App() {
          return <p>{formatDate(date$.get())}</p>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <p>
              <Memo>{() => formatDate(date$.get())}</Memo>
            </p>
          );
        }
      `,
    },

    "wraps .get() inside 3-level nested JSX": {
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
        import { Memo } from "@usels/core";
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

    "wraps reactive expression and reactive-attribute sibling independently": {
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
        import { Memo } from "@usels/core";
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

    "wraps .get() in arrow function component body": {
      code: `
        const App = () => (
          <div>{value$.get()}</div>
        );
      `,
      output: `
        import { Memo } from "@usels/core";
        const App = () => (
          <div>
            <Memo>{() => value$.get()}</Memo>
          </div>
        );
      `,
    },

    "wraps logical OR fallback expression with .get()": {
      code: `
        function App() {
          return <p>{user$.name.get() || 'Guest'}</p>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <p>
              <Memo>{() => user$.name.get() || "Guest"}</Memo>
            </p>
          );
        }
      `,
    },

    "wraps .map() items that have reactive attribute and content": {
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
        import { Memo } from "@usels/core";
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

    "wraps .get() inside JSXElement child within attribute": {
      code: `
        function App() {
          return <Panel aside={<Token>{count$.get()}</Token>}>content</Panel>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <Panel
              aside={
                <Token>
                  <Memo>{() => count$.get()}</Memo>
                </Token>
              }
            >
              content
            </Panel>
          );
        }
      `,
    },

    "wraps function call with .get() arg inside JSXElement child within attribute": {
      code: `
        function App() {
          return <Panel aside={<Token>{formatDate(date$.get())}</Token>}>content</Panel>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <Panel
              aside={
                <Token>
                  <Memo>{() => formatDate(date$.get())}</Memo>
                </Token>
              }
            >
              content
            </Panel>
          );
        }
      `,
    },

    "wraps .get() inside doubly nested attribute JSXElements": {
      code: `
        function App() {
          return <Panel aside={<Token some={<OtherToken>{formatDate(date$.get())}</OtherToken>}></Token>}>content</Panel>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <Panel
              aside={
                <Token
                  some={
                    <OtherToken>
                      <Memo>{() => formatDate(date$.get())}</Memo>
                    </OtherToken>
                  }
                ></Token>
              }
            >
              content
            </Panel>
          );
        }
      `,
    },

    "wraps .get() inside arrow function returning JSXElement in attribute": {
      code: `
        function App() {
          return <Panel aside={() => <Token>{date$.get()}</Token>}>content</Panel>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <Panel
              aside={() => (
                <Token>
                  <Memo>{() => date$.get()}</Memo>
                </Token>
              )}
            >
              content
            </Panel>
          );
        }
      `,
    },

    "wraps .get() in deeply nested JSXElement within attribute": {
      code: `
        function App() {
          return <Panel aside={<Outer><Inner>{obs$.get()}</Inner></Outer>}>content</Panel>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <Panel
              aside={
                <Outer>
                  <Inner>
                    <Memo>{() => obs$.get()}</Memo>
                  </Inner>
                </Outer>
              }
            >
              content
            </Panel>
          );
        }
      `,
    },
  },
});
