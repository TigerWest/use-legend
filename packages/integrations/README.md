# @usels/integrations

Observable-native third-party integrations for [Legend-State](https://legendapp.com/open-source/state/).

Inspired by [VueUse](https://vueuse.org/) and [react-use](https://github.com/streamich/react-use), `@usels/integrations` extends the observable-first approach to popular third-party libraries. just hooks that return Legend-State observables for fine-grained reactivity.

## Installation

```bash
npm install @usels/integrations@beta @usels/core@beta @legendapp/state react
# or
pnpm add @usels/integrations@beta @usels/core@beta @legendapp/state react
```

## TanStack Query

Observable-native hooks for [TanStack Query](https://tanstack.com/query). Query results are returned as Legend-State observables — `data$`, `isLoading$`, `error$` update with fine-grained reactivity instead of re-rendering the entire component.


### Hooks

| Hook | Description |
|------|-------------|
| `useQuery` | Observable-native data fetching |
| `useMutation` | Observable-native mutations |
| `useInfiniteQuery` | Observable-native infinite/paginated queries |
| `useQueryClient` | Access the QueryClient instance |

### Quick Example

```tsx
import { useQuery } from '@usels/integrations';

function UserProfile({ userId }: { userId: string }) {
  const query$ = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
  });

  return (
    <div>
      {query$.data.name.get()}
    </div>
  );
}
```

`query$.data` is an observable — only the expression reading it re-renders, not the component.

## Features

- **Observable-native** — query results as Legend-State observables, not `useState`
- **Fine-grained reactivity** — only the expression reading the observable re-renders
- **Drop-in replacement** — same API shape as `@tanstack/react-query`, with observable returns
- **Tree-shakeable** — import only what you need
- **TypeScript** — full type safety
- **ESM & CJS** — supports both module systems

## Links

- [Documentation](https://tigerwest.github.io/use-legend/)
- [GitHub](https://github.com/TigerWest/use-legend)

## License

MIT
