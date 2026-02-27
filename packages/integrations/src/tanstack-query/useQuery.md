---
title: useQuery
description: TanStack Query hook with Legend-State observable support
draft: true
category: Hooks
---

React hook for data fetching with automatic refetch when observable query keys change.


## Usage

```typescript
import { useQuery } from '@usels/integrations'
import { observable } from '@legendapp/state'

const userId$ = observable(1)

function UserProfile() {
  const query = useQuery({
    queryKey: ['user', userId$], // Auto-refetch when userId$ changes
    queryFn: () => fetchUser(userId$.get())
  })

  return (
    <div>
      {query.isLoading.get() && <p>Loading...</p>}
      {query.data.get() && <p>{query.data.name.get()}</p>}
    </div>
  )
}
```
