import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noHooksInScope } from "../../src/rules/no-hooks-in-scope";
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

ruleTester.run("no-hooks-in-scope", noHooksInScope, {
  valid: [
    {
      code: `
        import { useScope } from "@usels/core";

        function useCounter() {
          return useScope(() => {
            const count$ = observable(0);
            return { count$ };
          });
        }
      `,
    },
    {
      code: `
        function Component() {
          const value = useMemo(() => 1, []);
          return value;
        }
      `,
    },
    {
      code: `
        function Component() {
          "use scope";
          const count$ = observable(0);
          return <div>{count$.get()}</div>;
        }
      `,
    },
    {
      code: `
        function Component() {
          const label = "use scope";
          const value = useMemo(() => label, [label]);
          return value;
        }
      `,
    },
    {
      code: `
        import { useScope } from "@usels/core";

        function useCounter() {
          return useScope(() => ({ count$: observable(0) }), useProps());
        }
      `,
    },
    {
      code: `
        function useCounter() {
          return scope(() => {
            useThing();
          });
        }
      `,
    },
    {
      code: `
        import { useScope as scope } from "custom-scope";

        function useCounter() {
          return scope(() => {
            useThing();
          });
        }
      `,
      options: [{ useScopeSources: ["@usels/core"] }],
    },
  ],

  invalid: [
    {
      code: `
        import { useScope } from "@usels/core";

        function useCounter() {
          return useScope(() => {
            const [count] = useState(0);
            return { count };
          });
        }
      `,
      errors: [{ messageId: "hookInUseScope", data: { name: "useState" } }],
    },
    {
      code: `
        import { useScope } from "@usels/core";

        function useCounter() {
          return useScope(() => useThing());
        }
      `,
      errors: [{ messageId: "hookInUseScope", data: { name: "useThing" } }],
    },
    {
      code: `
        import { useScope } from "@usels/core";

        function useCounter() {
          return useScope(function () {
            React.useEffect(() => {}, []);
          });
        }
      `,
      errors: [{ messageId: "hookInUseScope", data: { name: "useEffect" } }],
    },
    {
      code: `
        import { useScope } from "@usels/core";

        function useCounter() {
          return useScope(() => {
            const setup = () => useThing();
            return { setup };
          });
        }
      `,
      errors: [{ messageId: "hookInUseScope", data: { name: "useThing" } }],
    },
    {
      code: `
        import { useScope as scoped } from "@usels/core";

        function useCounter() {
          return scoped(() => {
            useThing();
          });
        }
      `,
      errors: [{ messageId: "hookInUseScope", data: { name: "useThing" } }],
    },
    {
      code: `
        function Component() {
          "use scope";
          const value = useMemo(() => 1, []);
          return value;
        }
      `,
      errors: [{ messageId: "hookInScopeDirective", data: { name: "useMemo" } }],
    },
    {
      code: `
        function Component() {
          "use strict";
          "use scope";
          React.useState(0);
          return null;
        }
      `,
      errors: [{ messageId: "hookInScopeDirective", data: { name: "useState" } }],
    },
    {
      code: `
        function useCounter() {
          "use scope";
          return useOtherCounter();
        }
      `,
      errors: [{ messageId: "hookInScopeDirective", data: { name: "useOtherCounter" } }],
    },
    {
      code: `
        const useCounter = () => {
          "use scope";
          const count = useCounterState();
          useEffect(() => {}, []);
          return count;
        };
      `,
      errors: [
        { messageId: "hookInScopeDirective", data: { name: "useCounterState" } },
        { messageId: "hookInScopeDirective", data: { name: "useEffect" } },
      ],
    },
    {
      code: `
        import { useScope as scope } from "custom-scope";

        function useCounter() {
          return scope(() => {
            useThing();
          });
        }
      `,
      options: [{ useScopeSources: ["custom-scope"] }],
      errors: [{ messageId: "hookInUseScope", data: { name: "useThing" } }],
    },
    {
      code: `
        function ScopeComponent() {
          "use scope";
          const value = useMemo(() => 1, []);
          return value;
        }

        function NormalComponent() {
          const value = useMemo(() => 1, []);
          return value;
        }
      `,
      errors: [
        {
          messageId: "hookInScopeDirective",
          data: { name: "useMemo" },
          line: 4,
          column: 25,
        },
      ],
    },
    {
      code: `
        import { useScope } from "@usels/core";

        function NormalHook() {
          const [count, setCount] = useState(0);
          useEffect(() => {}, []);
          return count;
        }

        function useScopedHook() {
          return useScope(() => {
            const [count] = useState(0);
            useEffect(() => {}, []);
            return { count };
          });
        }
      `,
      errors: [
        {
          messageId: "hookInUseScope",
          data: { name: "useState" },
          line: 12,
          column: 29,
        },
        {
          messageId: "hookInUseScope",
          data: { name: "useEffect" },
          line: 13,
          column: 13,
        },
      ],
    },
    {
      code: `
        import { useScope } from "@usels/core";

        function useScopedHook() {
          return useScope(() => {
            useThing();
            return {};
          });
        }

        function ScopeComponent() {
          "use scope";
          useOther();
          return null;
        }

        function NormalComponent() {
          useMemo(() => 1, []);
          return null;
        }
      `,
      errors: [
        {
          messageId: "hookInUseScope",
          data: { name: "useThing" },
          line: 6,
          column: 13,
        },
        {
          messageId: "hookInScopeDirective",
          data: { name: "useOther" },
          line: 13,
          column: 11,
        },
      ],
    },
  ],
});
