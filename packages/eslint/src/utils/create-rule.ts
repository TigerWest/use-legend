import { ESLintUtils } from "@typescript-eslint/utils";

const REPO = "TigerWest/use-legend";

export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/${REPO}/blob/main/packages/eslint/docs/rules/${name}.md`
);
