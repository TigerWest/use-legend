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
  title: "fine-grained reactive memo boundaries",
  tests: {
    "splits ternary branches under the condition source": {
      code: `
        function App() {
          return <div>{a$.get() ? b$.get() : c$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <div>
              <Memo>
                {() => (a$.get() ? <Memo>{() => b$.get()}</Memo> : <Memo>{() => c$.get()}</Memo>)}
              </Memo>
            </div>
          );
        }
      `,
    },

    "allows nested child memo when parent attribute reads a different source": {
      code: `
        function App() {
          return <div className={theme$.get()}>{count$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <Memo>
              {() => (
                <div className={theme$.get()}>
                  <Memo>{() => count$.get()}</Memo>
                </div>
              )}
            </Memo>
          );
        }
      `,
    },

    "removes nested child memo when parent attribute already reads the same source": {
      code: `
        function App() {
          return <div className={theme$.get()}>{theme$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return <Memo>{() => <div className={theme$.get()}>{theme$.get()}</div>}</Memo>;
        }
      `,
    },

    "does not split user-authored Memo children": {
      code: `
        function App() {
          return <Memo>{() => a$.get() ? b$.get() : c$.get()}</Memo>;
        }
      `,
      output: `
        function App() {
          return <Memo>{() => (a$.get() ? b$.get() : c$.get())}</Memo>;
        }
      `,
    },

    "keeps unsplittable binary expressions in one Memo": {
      code: `
        function App() {
          return <div>{a$.get() + " " + b$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <div>
              <Memo>{() => a$.get() + " " + b$.get()}</Memo>
            </div>
          );
        }
      `,
    },

    "merges static text around a single source": {
      code: `
        function App() {
          return <div>Hello {name$.get()}!</div>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <div>
              <Memo>{() => <>Hello {name$.get()}!</>}</Memo>
            </div>
          );
        }
      `,
    },

    "keeps different text child sources in separate Memos": {
      code: `
        function App() {
          return <div>Hello {first$.get()} {last$.get()}!</div>;
        }
      `,
      output: `
        import { Memo } from "@usels/core";
        function App() {
          return (
            <div>
              Hello <Memo>{() => first$.get()}</Memo> <Memo>{() => last$.get()}</Memo>!
            </div>
          );
        }
      `,
    },
  },
});
