import chokidar from 'chokidar'
import * as path from 'path'
import { watchDocsConfig } from './config'
import { runCollectDocs } from './run-collect-docs'

let debounceTimer: NodeJS.Timeout | null = null

function debounceCollectDocs(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(async () => {
    try {
      await runCollectDocs()
    } catch (err) {
      console.error('Failed to run collect-docs:', err)
    }
  }, watchDocsConfig.DEBOUNCE_MS)
}

export async function runWatchDocs(): Promise<void> {
  console.log('👀 Watching documentation files...')
  console.log(`   DOCS_ENABLE_NATIVE_TAB=${watchDocsConfig.DOCS_ENABLE_NATIVE_TAB ? '1' : '0'}`)
  console.log(
    `   Patterns: ${watchDocsConfig.watchPatterns
      .map(p => path.relative(watchDocsConfig.PACKAGES_ROOT, p))
      .join(', ')}`
  )
  console.log(`   Debounce: ${watchDocsConfig.DEBOUNCE_MS}ms\n`)

  const watcher = chokidar.watch(watchDocsConfig.watchPatterns, {
    ignored: watchDocsConfig.ignorePatterns,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  })

  watcher
    .on('add', filePath => {
      console.log(`📝 File added: ${path.relative(watchDocsConfig.PACKAGES_ROOT, filePath)}`)
      debounceCollectDocs()
    })
    .on('change', filePath => {
      console.log(`📝 File changed: ${path.relative(watchDocsConfig.PACKAGES_ROOT, filePath)}`)
      debounceCollectDocs()
    })
    .on('unlink', filePath => {
      console.log(`📝 File removed: ${path.relative(watchDocsConfig.PACKAGES_ROOT, filePath)}`)
      debounceCollectDocs()
    })
    .on('error', error => {
      console.error(`❌ Watcher error: ${error}`)
      process.exit(1)
    })

  process.on('SIGINT', () => {
    console.log('\n👋 Stopping watcher...')
    watcher.close()
    process.exit(0)
  })
}
