import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noReactiveHoc } from '../../src/rules/no-reactive-hoc';
import * as parser from '@typescript-eslint/parser';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
});

ruleTester.run('no-reactive-hoc', noReactiveHoc, {
  valid: [
    // 1. No import of HOCs at all
    {
      code: `function MyComponent() { return null; }`,
    },
    // 2. Import observer from a non-tracked source (mobx-react)
    {
      code: `
        import { observer } from 'mobx-react';
        const MyComponent = observer(() => null);
      `,
    },
    // 3. Re-export only — not calling the HOC (ExportNamedDeclaration, not CallExpression)
    {
      code: `export { observer } from '@legendapp/state/react';`,
    },
    // 4. Import from tracked source but never call it
    {
      code: `
        import { observer } from '@legendapp/state/react';
        const name = 'observer';
      `,
    },
    // 5. observer in allowList — should not warn
    {
      code: `
        import { observer } from '@legendapp/state/react';
        const MyComponent = observer(() => null);
      `,
      options: [{ allowList: ['observer'] }],
    },
    // 6. All three HOCs in allowList
    {
      code: `
        import { reactive, reactiveObserver, observer } from '@legendapp/state/react';
        const A = reactive(Button);
        const B = reactiveObserver(() => null);
        const C = observer(() => null);
      `,
      options: [{ allowList: ['reactive', 'reactiveObserver', 'observer'] }],
    },
    // 7. Call a same-named function from a non-tracked source
    {
      code: `
        import { observer } from 'some-other-lib';
        const MyComponent = observer(() => null);
      `,
    },
    // 8. Custom importSources — import from default source does not trigger
    {
      code: `
        import { observer } from '@legendapp/state/react';
        const MyComponent = observer(() => null);
      `,
      options: [{ importSources: ['my-custom-lib'] }],
    },
    // 9. Member expression call — only plain Identifier calls are checked
    {
      code: `
        import { observer } from '@legendapp/state/react';
        const MyComponent = React.observer(() => null);
      `,
    },
  ],

  invalid: [
    // 1. observer() from @legendapp/state/react
    {
      code: `
        import { observer } from '@legendapp/state/react';
        const MyComponent = observer(() => { return null; });
      `,
      errors: [{ messageId: 'noReactiveHoc', data: { name: 'observer' } }],
    },
    // 2. reactive() from @legendapp/state/react
    {
      code: `
        import { reactive } from '@legendapp/state/react';
        const ReactiveButton = reactive(Button);
      `,
      errors: [{ messageId: 'noReactiveHoc', data: { name: 'reactive' } }],
    },
    // 3. reactiveObserver() from @legendapp/state/react
    {
      code: `
        import { reactiveObserver } from '@legendapp/state/react';
        const MyComponent = reactiveObserver(() => { return null; });
      `,
      errors: [{ messageId: 'noReactiveHoc', data: { name: 'reactiveObserver' } }],
    },
    // 4. Aliased import: observer as obs
    {
      code: `
        import { observer as obs } from '@legendapp/state/react';
        const MyComponent = obs(() => null);
      `,
      errors: [{ messageId: 'noReactiveHoc', data: { name: 'obs' } }],
    },
    // 5. Multiple HOCs in one file — each call reports
    {
      code: `
        import { observer, reactive } from '@legendapp/state/react';
        const A = observer(() => null);
        const B = reactive(Button);
      `,
      errors: [
        { messageId: 'noReactiveHoc', data: { name: 'observer' } },
        { messageId: 'noReactiveHoc', data: { name: 'reactive' } },
      ],
    },
    // 6. Custom importSources option
    {
      code: `
        import { observer } from 'my-custom-lib';
        const MyComponent = observer(() => null);
      `,
      options: [{ importSources: ['my-custom-lib'] }],
      errors: [{ messageId: 'noReactiveHoc', data: { name: 'observer' } }],
    },
    // 7. Custom forbidHOCs option
    {
      code: `
        import { withReactivity } from '@legendapp/state/react';
        const MyComponent = withReactivity(() => null);
      `,
      options: [{ forbidHOCs: ['withReactivity'] }],
      errors: [{ messageId: 'noReactiveHoc', data: { name: 'withReactivity' } }],
    },
    // 8. reactive used with allowList excluding only reactiveObserver
    {
      code: `
        import { reactive, reactiveObserver } from '@legendapp/state/react';
        const A = reactive(Button);
        const B = reactiveObserver(() => null);
      `,
      options: [{ allowList: ['reactiveObserver'] }],
      errors: [{ messageId: 'noReactiveHoc', data: { name: 'reactive' } }],
    },
  ],
});
