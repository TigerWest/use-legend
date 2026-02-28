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
  title: 'skip / edge cases',
  tests: {
    'does NOT wrap inside existing <Memo>': {
      code: `
        function App() {
          return <Memo>{() => count$.get()}</Memo>;
        }
      `,
    },

    'does NOT wrap inside <For>': {
      code: `
        function App() {
          return <For each={list$}>{(item) => <div>{item.name.get()}</div>}</For>;
        }
      `,
    },

    'does NOT wrap inside <Show>': {
      code: `
        function App() {
          return <Show if={isVisible$}>{() => <span>{label$.get()}</span>}</Show>;
        }
      `,
    },

    'does NOT wrap inside <Memo>': {
      code: `
        function App() {
          return <Memo>{() => <p>{count$.get()}</p>}</Memo>;
        }
      `,
    },

    'does NOT wrap inside <Computed>': {
      code: `
        function App() {
          return <Computed>{() => <p>{count$.get()}</p>}</Computed>;
        }
      `,
    },

    'does NOT wrap inside <Switch>': {
      code: `
        function App() {
          return <Switch value={val$}>{count$.get()}</Switch>;
        }
      `,
    },

    'does NOT wrap inside observer() HOC': {
      code: `const Comp = observer(() => <div>{obs$.get()}</div>);`,
    },

    'does NOT wrap Map.get("key") with string arg': {
      code: `
        function App() {
          return <div>{map.get("key")}</div>;
        }
      `,
    },

    'does NOT wrap Map.get(variable) with variable arg': {
      code: `
        function App() {
          return <div>{map.get(id)}</div>;
        }
      `,
    },

    'does NOT wrap store.get() without $ suffix (allGet:false default)': {
      code: `
        function App() {
          return <div>{store.get()}</div>;
        }
      `,
    },

    'does NOT wrap .get() inside onClick arrow function': {
      code: `
        function App() {
          return <button onClick={() => count$.get()}>click</button>;
        }
      `,
    },

    'does NOT wrap .get() inside onChange regular function': {
      code: `
        function App() {
          return <input onChange={function() { obs$.get(); }} />;
        }
      `,
      output: `
        function App() {
          return (
            <input
              onChange={function () {
                obs$.get();
              }}
            />
          );
        }
      `,
    },

    'does NOT wrap .get() inside useMemo callback': {
      code: `
        function App() {
          return <div>{useMemo(() => obs$.get(), [])}</div>;
        }
      `,
    },

    'does NOT wrap .get() inside useCallback callback': {
      code: `
        function App() {
          return <div>{useCallback(() => obs$.get(), [])}</div>;
        }
      `,
    },

    'wraps obs$?.get() optional call': {
      code: `
        function App() {
          return <div>{obs$?.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => obs$?.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps obs$.items[0].get() with computed access': {
      code: `
        function App() {
          return <div>{obs$.items[0].get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => obs$.items[0].get()}</Memo>
            </div>
          );
        }
      `,
    },

    'wraps only the child with .get(), leaves siblings untouched': {
      code: `
        function App() {
          return <div>{count$.get()}<p>static</p></div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => count$.get()}</Memo>
              <p>static</p>
            </div>
          );
        }
      `,
    },

    'wraps .get() inside Fragment': {
      code: `
        function App() {
          return <>{count$.get()}<p>hello</p></>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <>
              <Memo>{() => count$.get()}</Memo>
              <p>hello</p>
            </>
          );
        }
      `,
    },

    'wraps .get() inside .map() callback JSX child': {
      code: `
        function App() {
          return <ul>{items.map(item$ => <li>{item$.name.get()}</li>)}</ul>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <ul>
              {items.map((item$) => (
                <li>
                  <Memo>{() => item$.name.get()}</Memo>
                </li>
              ))}
            </ul>
          );
        }
      `,
    },
  },
});
