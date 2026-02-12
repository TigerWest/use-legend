import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Define workspace packages
  'packages/*',
  {
    // Shared test configuration for all packages
    test: {
      globals: true,
      environment: 'node',
    },
  },
]);
