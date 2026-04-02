import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noGetInNonReactive } from "../../src/rules/no-get-in-non-reactive";
import * as parser from "@typescript-eslint/parser";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("no-get-in-non-reactive", noGetInNonReactive, {
  valid: [
    // 1. .get() inside useObservable callback
    {
      code: `
        function MyComponent() {
          const x$ = useObservable(() => obs$.get());
        }
      `,
    },
    // 2. .get() inside useObserve callback
    {
      code: `
        function MyComponent() {
          useObserve(() => { obs$.get(); });
        }
      `,
    },
    // 3. .get() inside arrow function (nested callback)
    {
      code: `
        function MyComponent() {
          const handler = () => { obs$.get(); };
        }
      `,
    },
    // 4. .get() inside regular nested function
    {
      code: `
        function MyComponent() {
          function inner() { obs$.get(); }
        }
      `,
    },
    // 5. .get() inside FunctionExpression
    {
      code: `
        function MyComponent() {
          setTimeout(function() { obs$.get(); });
        }
      `,
    },
    // 6. .get() in a plain module-level utility function (not component/hook)
    {
      code: `
        function processData() {
          const x = obs$.get();
        }
      `,
    },
    // 7. .get() on non-$-suffixed identifier (not an observable)
    {
      code: `
        function MyComponent() {
          const x = value.get();
        }
      `,
    },
    // 8. .get() with arguments — not a Legend-State observable read
    {
      code: `
        function MyComponent() {
          const x = map$.get("key");
        }
      `,
    },
    // 9. .peek() in component body — intentional non-reactive read, always ok
    {
      code: `
        function MyComponent() {
          const x = obs$.peek();
        }
      `,
    },
    // 10. Arrow function component with .get() inside nested callback
    {
      code: `
        export const MyComponent = () => {
          useObserve(() => { obs$.get(); });
        };
      `,
    },
    // 11. Hook with .get() inside useObservable callback
    {
      code: `
        export function useMyHook() {
          const derived$ = useObservable(() => source$.get());
          return derived$;
        }
      `,
    },
    // 12. Non-module-level function (nested component — rare but skip)
    {
      code: `
        function Outer() {
          function Inner() {
            const x = obs$.get();
          }
        }
      `,
    },
    // 13. Chained member .get() inside reactive callback
    {
      code: `
        function MyComponent() {
          useObserve(() => { user$.profile.name.get(); });
        }
      `,
    },
    // 14. .get() inside useCallback — intentional non-reactive read (selector pattern)
    {
      code: `
        function MyComponent() {
          const handler = useCallback(() => { obs$.get(); }, []);
        }
      `,
    },
  ],

  invalid: [
    // 1. Basic: .get() directly in component body
    {
      code: `
        function MyComponent() {
          const x = obs$.get();
        }
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "obs$" } }],
    },
    // 2. Exported component
    {
      code: `
        export function MyComponent() {
          const value = count$.get();
          return value;
        }
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "count$" } }],
    },
    // 3. Arrow function component (const PascalCase = () => {})
    {
      code: `
        export const MyComponent = () => {
          const x = obs$.get();
        };
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "obs$" } }],
    },
    // 4. Hook body
    {
      code: `
        function useMyHook() {
          const x = obs$.get();
        }
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "obs$" } }],
    },
    // 5. Exported hook
    {
      code: `
        export function useCounter() {
          const value = count$.get();
          return value;
        }
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "count$" } }],
    },
    // 6. Arrow function hook
    {
      code: `
        export const useMyHook = () => {
          const x = obs$.get();
        };
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "obs$" } }],
    },
    // 7. Multiple .get() calls in one component — each reports
    {
      code: `
        function MyComponent() {
          const a = foo$.get();
          const b = bar$.get();
        }
      `,
      errors: [
        { messageId: "noGetInNonReactive", data: { name: "foo$" } },
        { messageId: "noGetInNonReactive", data: { name: "bar$" } },
      ],
    },
    // 8. Chained member expression .get() in component body
    {
      code: `
        function MyComponent() {
          const name = user$.profile.get();
        }
      `,
      errors: [
        { messageId: "noGetInNonReactive", data: { name: "user$.profile" } },
      ],
    },
    // 9. .get() used in JSX expression directly (still in component body scope)
    {
      code: `
        function MyComponent() {
          return <div>{obs$.get()}</div>;
        }
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "obs$" } }],
    },
    // 10. .get() in conditional in component body
    {
      code: `
        function MyComponent() {
          if (flag$.get()) return null;
        }
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "flag$" } }],
    },
    // 11. export default function component
    {
      code: `
        export default function MyComponent() {
          const x = obs$.get();
        }
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "obs$" } }],
    },
    // 12. Non-exported module-level arrow component
    {
      code: `
        const MyComponent = () => {
          const x = obs$.get();
        };
      `,
      errors: [{ messageId: "noGetInNonReactive", data: { name: "obs$" } }],
    },
  ],
});
