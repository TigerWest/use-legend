import pluginTester from 'babel-plugin-tester';
import plugin from '../src';

const babelOptions = {
  plugins: ['@babel/plugin-syntax-jsx'],
  configFile: false,
  babelrc: false,
};

pluginTester({
  plugin,
  pluginOptions: { componentName: 'Reactive', importSource: '@usels/core' },
  babelOptions,
  title: 'componentName option',
  tests: {
    'uses custom componentName "Reactive"': {
      code: `
        function App() {
          return <div>{count$.get()}</div>;
        }
      `,
      output: `
        import { Reactive } from "@usels/core";
        function App() {
          return (
            <div>
              <Reactive>{() => count$.get()}</Reactive>
            </div>
          );
        }
      `,
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: { importSource: '@my/lib' },
  babelOptions,
  title: 'importSource option',
  tests: {
    'uses custom importSource "@my/lib"': {
      code: `
        function App() {
          return <div>{count$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@my/lib";
        function App() {
          return (
            <div>
              <Memo>{() => count$.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'does not duplicate import when already imported from @my/lib': {
      code: `
        import { Memo } from "@my/lib";
        function App() {
          return <div>{count$.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@my/lib";
        function App() {
          return (
            <div>
              <Memo>{() => count$.get()}</Memo>
            </div>
          );
        }
      `,
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: { allGet: true },
  babelOptions,
  title: 'allGet option',
  tests: {
    'with allGet:true, wraps store.get() without $ suffix': {
      code: `
        function App() {
          return <div>{store.get()}</div>;
        }
      `,
      output: `
        import { Memo } from "@legendapp/state/react";
        function App() {
          return (
            <div>
              <Memo>{() => store.get()}</Memo>
            </div>
          );
        }
      `,
    },

    'with allGet:true, still ignores .get() with args': {
      code: `
        function App() {
          return <div>{map.get("key")}</div>;
        }
      `,
    },

    'with allGet:true, still ignores .get() inside function boundary': {
      code: `
        function App() {
          return <button onClick={() => store.get()}>click</button>;
        }
      `,
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: { reactiveComponents: ['CustomReactive'] },
  babelOptions,
  title: 'reactiveComponents option',
  tests: {
    'does NOT wrap inside custom reactive component': {
      code: `
        function App() {
          return <CustomReactive>{() => count$.get()}</CustomReactive>;
        }
      `,
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: { observerNames: ['reactive'] },
  babelOptions,
  title: 'observerNames option',
  tests: {
    'does NOT wrap inside custom observer HOC "reactive"': {
      code: `const Comp = reactive(() => <div>{obs$.get()}</div>);`,
    },
  },
});
