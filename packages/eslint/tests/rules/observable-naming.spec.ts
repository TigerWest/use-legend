import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { observableNaming } from '../../src/rules/observable-naming';
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

ruleTester.run('observable-naming', observableNaming, {
  valid: [
    // 1. Correct $ suffix
    {
      code: `
        import { useObservable } from '@legendapp/state/react';
        const count$ = useObservable(0);
      `,
    },
    // 2. $ suffix on observable
    {
      code: `
        import { observable } from '@legendapp/state';
        const data$ = observable({ name: 'foo' });
      `,
    },
    // 3. Object destructuring is ignored
    {
      code: `
        import { useObservable } from '@legendapp/state/react';
        const { x$, y$ } = useDraggable(el);
      `,
    },
    // 4. Array destructuring is ignored
    {
      code: `
        const [item$] = useState(obs);
      `,
    },
    // 5. for...of loop variable is ignored
    {
      code: `
        import { observable } from '@legendapp/state';
        for (const item of items$) { }
      `,
    },
    // 6. Not a tracked function (useState from react, not tracked)
    {
      code: `
        import { useState } from 'react';
        const count = useState(0)[0];
      `,
    },
    // 7. Completely untracked function
    {
      code: `
        const count = someRandomFn();
      `,
    },
    // 8. allowPattern: '^_' makes _count valid
    {
      code: `
        import { useObservable } from '@legendapp/state/react';
        const _count = useObservable(0);
      `,
      options: [
        {
          libraries: {
            '@legendapp/state/react': { tracks: ['useObservable'] },
          },
          allowPattern: '^_',
        },
      ],
    },
    // 9. computed with $ suffix
    {
      code: `
        import { observable, computed } from '@legendapp/state';
        const base$ = observable(0);
        const doubled$ = computed(() => base$.get() * 2);
      `,
    },
    // 10. useObservableState with $ suffix
    {
      code: `
        import { useObservableState } from '@legendapp/state/react';
        const value$ = useObservableState(0);
      `,
    },
    // 11. @usels/core: ignored functions should NOT be flagged (default ignores)
    {
      code: `
        import { useInitialPick, get, peek, useRafFn, useDebounceFn, useThrottleFn } from '@usels/core';
        const { immediate } = useInitialPick(obs, { immediate: true });
        const value = get(obs);
        const peeked = peek(obs);
      `,
    },
    // 12. @usels/core: observable-returning function WITH $ suffix is valid
    {
      code: `
        import { useAutoReset } from '@usels/core';
        const count$ = useAutoReset(0, 1000);
      `,
    },
    // 13. @usels/web: ignored functions should NOT be flagged
    {
      code: `
        import { useInitialPick, get } from '@usels/web';
        const { immediate } = useInitialPick(obs, { immediate: true });
        const value = get(obs);
      `,
    },
    // 14. @usels/web: observable-returning function WITH $ suffix is valid
    {
      code: `
        import { useDebounced } from '@usels/web';
        const debounced$ = useDebounced(value$, 300);
      `,
    },
    // 15. Aliased ignored function should still be ignored
    {
      code: `
        import { get as getValue } from '@usels/core';
        const value = getValue(obs);
      `,
    },
    // 16. libraries: {} (track all) — untracked lib is not flagged
    {
      code: `
        import { something } from 'untracked-lib';
        const val = something();
      `,
    },
    // 17. tracks + ignores: tracks takes precedence, ignored fn is not tracked
    {
      code: `
        import { foo, bar } from 'my-lib';
        const val = bar();
      `,
      options: [
        {
          libraries: {
            'my-lib': { tracks: ['foo'], ignores: ['bar'] },
          },
          allowPattern: null,
        },
      ],
    },
  ],

  invalid: [
    // 1. useObservable without $ suffix
    {
      code: `
        import { useObservable } from '@legendapp/state/react';
        const count = useObservable(0);
      `,
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'count' },
        },
      ],
    },
    // 2. observable without $ suffix
    {
      code: `
        import { observable } from '@legendapp/state';
        const data = observable({});
      `,
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'data' },
        },
      ],
    },
    // 3. useObservableState without $ suffix
    {
      code: `
        import { useObservableState } from '@legendapp/state/react';
        const x = useObservableState(0);
      `,
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'x' },
        },
      ],
    },
    // 4. isLoading without $ suffix
    {
      code: `
        import { useObservable } from '@legendapp/state/react';
        const isLoading = useObservable(false);
      `,
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'isLoading' },
        },
      ],
    },
    // 5. computed without $ suffix
    {
      code: `
        import { computed } from '@legendapp/state';
        const doubled = computed(() => 2);
      `,
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'doubled' },
        },
      ],
    },
    // 6. Multiple declarations, one invalid
    {
      code: `
        import { observable } from '@legendapp/state';
        const good$ = observable(0);
        const bad = observable(1);
      `,
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'bad' },
        },
      ],
    },
    // 7. allowPattern but name doesn't match - still invalid
    {
      code: `
        import { useObservable } from '@legendapp/state/react';
        const count = useObservable(0);
      `,
      options: [
        {
          libraries: {
            '@legendapp/state/react': { tracks: ['useObservable'] },
          },
          allowPattern: '^_',
        },
      ],
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'count' },
        },
      ],
    },
    // 8. @usels/core: observable-returning function without $ suffix
    {
      code: `
        import { useAutoReset } from '@usels/core';
        const count = useAutoReset(0, 1000);
      `,
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'count' },
        },
      ],
    },
    // 9. @usels/web: observable-returning function without $ suffix
    {
      code: `
        import { useDebounced } from '@usels/web';
        const debounced = useDebounced(value$, 300);
      `,
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'debounced' },
        },
      ],
    },
    // 10. libraries: {} (track all) — all functions flagged
    {
      code: `
        import { anything } from 'custom-observable-lib';
        const val = anything();
      `,
      options: [
        {
          libraries: {
            'custom-observable-lib': {},
          },
          allowPattern: null,
        },
      ],
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'val' },
        },
      ],
    },
    // 11. ignores: function NOT in ignores is still tracked
    {
      code: `
        import { tracked, ignored } from 'my-lib';
        const val = tracked();
      `,
      options: [
        {
          libraries: {
            'my-lib': { ignores: ['ignored'] },
          },
          allowPattern: null,
        },
      ],
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'val' },
        },
      ],
    },
    // 12. tracks + ignores: tracks takes precedence, tracked fn is still flagged
    {
      code: `
        import { foo } from 'my-lib';
        const val = foo();
      `,
      options: [
        {
          libraries: {
            'my-lib': { tracks: ['foo'], ignores: ['foo'] },
          },
          allowPattern: null,
        },
      ],
      errors: [
        {
          messageId: 'missingDollarSuffix',
          data: { name: 'val' },
        },
      ],
    },
  ],
});
