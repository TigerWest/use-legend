import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { hookReturnNaming } from '../../src/rules/hook-return-naming';
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

ruleTester.run('hook-return-naming', hookReturnNaming, {
  valid: [
    // 1. Shorthand - key and local are same, always valid
    {
      code: `const { x$, isDragging$ } = useDraggable(target);`,
    },
    // 2. Renamed with $ suffix preserved
    {
      code: `const { x$: posX$, isDragging$: dragging$ } = useDraggable(target);`,
    },
    // 3. Non-$ fields can be renamed freely
    {
      code: `const { stop, pause: p } = useIntersectionObserver(el$, cb);`,
    },
    // 4. Shorthand single field
    {
      code: `const { files$ } = useDropZone(target);`,
    },
    // 5. Mix of $ shorthand and non-$ renamed
    {
      code: `const { x$, stop: s, isDragging$ } = useDraggable(target);`,
    },
    // 6. Rest element is ignored
    {
      code: `const { x$, ...rest } = useDraggable(target);`,
    },
    // 7. enforceOnAllDestructuring: false, non-call init is skipped
    {
      code: `const { x$: x } = someObj;`,
      options: [{ enforceOnAllDestructuring: false }],
    },
    // 8. enforceOnAllDestructuring: false, but init IS a call — still enforced
    {
      code: `const { x$: posX$ } = useDraggable(target);`,
      options: [{ enforceOnAllDestructuring: false }],
    },
    // 9. Nested destructuring value is skipped (not a plain Identifier)
    {
      code: `const { x$: { a } } = useDraggable(target);`,
    },
    // 10. Computed property key is skipped (key.type !== Identifier)
    {
      code: `const { ['x$']: x } = useDraggable(target);`,
    },
    // 11. $ renamed to $ variant with different prefix
    {
      code: `const { count$: myCount$ } = useCounter();`,
    },
  ],

  invalid: [
    // 1. Single violation — $ suffix removed
    {
      code: `const { x$: x } = useDraggable(target);`,
      errors: [
        {
          messageId: 'dollarSuffixRemoved',
          data: { key: 'x$', local: 'x' },
        },
      ],
    },
    // 2. isDragging$ renamed without $
    {
      code: `const { isDragging$: dragging } = useDraggable(target);`,
      errors: [
        {
          messageId: 'dollarSuffixRemoved',
          data: { key: 'isDragging$', local: 'dragging' },
        },
      ],
    },
    // 3. files$ renamed without $
    {
      code: `const { files$: files } = useDropZone(target);`,
      errors: [
        {
          messageId: 'dollarSuffixRemoved',
          data: { key: 'files$', local: 'files' },
        },
      ],
    },
    // 4. Multiple violations in one destructure
    {
      code: `const { x$: x, isDragging$: dragging } = useDraggable(target);`,
      errors: [
        {
          messageId: 'dollarSuffixRemoved',
          data: { key: 'x$', local: 'x' },
        },
        {
          messageId: 'dollarSuffixRemoved',
          data: { key: 'isDragging$', local: 'dragging' },
        },
      ],
    },
    // 5. Mix: one valid (non-$ key renamed), one invalid ($ key renamed without $)
    {
      code: `const { stop: s, x$: x } = useDraggable(target);`,
      errors: [
        {
          messageId: 'dollarSuffixRemoved',
          data: { key: 'x$', local: 'x' },
        },
      ],
    },
    // 6. Mix: shorthand valid, renamed invalid
    {
      code: `const { isDragging$, x$: x } = useDraggable(target);`,
      errors: [
        {
          messageId: 'dollarSuffixRemoved',
          data: { key: 'x$', local: 'x' },
        },
      ],
    },
    // 7. enforceOnAllDestructuring: false with call expression — still invalid
    {
      code: `const { x$: x } = useDraggable(target);`,
      options: [{ enforceOnAllDestructuring: false }],
      errors: [
        {
          messageId: 'dollarSuffixRemoved',
          data: { key: 'x$', local: 'x' },
        },
      ],
    },
    // 8. Non-hook function call with $ destructuring — still caught by default
    {
      code: `const { count$: count } = getState();`,
      errors: [
        {
          messageId: 'dollarSuffixRemoved',
          data: { key: 'count$', local: 'count' },
        },
      ],
    },
  ],
});
