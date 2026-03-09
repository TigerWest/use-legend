# use-legend

Observable-native React utility hooks built on [Legend-State](https://legendapp.com/open-source/state/).

Inspired by [VueUse](https://vueuse.org/) and [react-use](https://github.com/streamich/react-use), `use-legend` brings the same composable utility philosophy — but built from the ground up for **observable-first reactivity**. Instead of `useState` and re-renders, every hook returns Legend-State observables for fine-grained updates without re-rendering the entire component tree.

## Packages

| Package | Description |
|---------|-------------|
| [`@usels/core`](./packages/core) | React hooks for elements, sensors, and browser APIs |
| [`@usels/tanstack-query`](./packages/libraries/tanstack-query) | TanStack Query integration with Legend-State |

### @usels/core

```bash
pnpm add @usels/core@beta @legendapp/state@beta
```

## Development

```bash
pnpm install      # install dependencies
pnpm build        # build all packages
pnpm dev          # watch mode
pnpm test         # run tests
pnpm lint         # lint
```

## Requirements

- Node >= 22
- pnpm >= 8

## License

MIT
