import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noObservableInJsx } from '../../src/rules/no-observable-in-jsx';
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
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run('no-observable-in-jsx', noObservableInJsx, {
  valid: [
    // .get() call as child
    {
      code: `const el = <div>{count$.get()}</div>;`,
    },
    // Nested member .get()
    {
      code: `const el = <div>{user$.name.get()}</div>;`,
    },
    // Arrow function child — the function itself is not an observable
    {
      code: `const el = <Memo>{() => count$.get()}</Memo>;`,
    },
    // No $ suffix — not an observable
    {
      code: `const el = <div>{count}</div>;`,
    },
    // Plain member expression without $ root
    {
      code: `const el = <div>{someObj.value}</div>;`,
    },
    // Observable in any prop — allowed (type system handles compatibility)
    {
      code: `const el = <div className={style$}></div>;`,
    },
    {
      code: `const el = <CustomComp value={counter$} />;`,
    },
    {
      code: `const el = <div ref={el$}></div>;`,
    },
    {
      code: `const el = <Show if={isLoading$}><Spinner /></Show>;`,
    },
    {
      code: `const el = <For each={items$} limit={count$}><Item /></For>;`,
    },
    // Fragment with non-observable child
    {
      code: `const el = <>{count$.get()}</>;`,
    },
  ],

  invalid: [
    // Direct observable as child of JSXElement
    {
      code: `const el = <div>{count$}</div>;`,
      errors: [{ messageId: 'observableInJsx', data: { name: 'count$' } }],
    },
    // Member expression as child
    {
      code: `const el = <span>{user$.name}</span>;`,
      errors: [
        { messageId: 'observableInJsx', data: { name: 'user$.name' } },
      ],
    },
    // Deeply nested member expression
    {
      code: `const el = <p>{form$.fields.email}</p>;`,
      errors: [
        { messageId: 'observableInJsx', data: { name: 'form$.fields.email' } },
      ],
    },
    // Observable as child of previously-allowlisted components — no more exception
    {
      code: `const el = <Show>{obs$}</Show>;`,
      errors: [{ messageId: 'observableInJsx', data: { name: 'obs$' } }],
    },
    {
      code: `const el = <Computed>{obs$}</Computed>;`,
      errors: [{ messageId: 'observableInJsx', data: { name: 'obs$' } }],
    },
    // Observable as child of JSXFragment
    {
      code: `const el = <>{count$}</>;`,
      errors: [{ messageId: 'observableInJsx', data: { name: 'count$' } }],
    },
  ],
});
