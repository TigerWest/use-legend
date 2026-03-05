#!/usr/bin/env tsx
import { runWatchDocs } from './watch-docs/index'

runWatchDocs().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
