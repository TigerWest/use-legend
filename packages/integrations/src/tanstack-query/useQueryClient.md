---
title: useQueryClient
description: Hook to access QueryClient from context
draft: true
category: Hooks
---

React hook that returns the QueryClient instance from the nearest QueryClientProvider.

## Returns

The QueryClient instance from context.

## Usage

```typescript
import { useQueryClient } from '@usels/integrations'

function MyComponent() {
  const queryClient = useQueryClient()

  const handleInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  return <button onClick={handleInvalidate}>Refresh Users</button>
}
```
