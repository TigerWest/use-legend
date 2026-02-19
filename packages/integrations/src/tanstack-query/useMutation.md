---
title: useMutation
description: TanStack mutation hook with observable state
category: Hooks
---

React hook for performing mutations with observable state management.


## Usage

```typescript
import { useMutation } from '@las/integrations'

function CreateUser() {
  const mutation = useMutation({
    mutationFn: (user: User) => createUser(user),
    onSuccess: () => {
      console.log('User created!')
    }
  })

  const handleSubmit = () => {
    mutation.mutate.get()({ name: 'John', email: 'john@example.com' })
  }

  return (
    <button onClick={handleSubmit} disabled={mutation.isPending.get()}>
      Create User
    </button>
  )
}
```
