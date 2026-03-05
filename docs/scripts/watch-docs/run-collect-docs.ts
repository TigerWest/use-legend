import { spawn } from 'child_process'
import { watchDocsConfig } from './config'

export function runCollectDocs(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('\n📝 Running collect-docs...')

    const child = spawn('tsx', ['scripts/collect-docs.ts'], {
      cwd: watchDocsConfig.ASTRO_ROOT,
      stdio: 'inherit',
    })

    child.on('close', code => {
      if (code === 0) {
        console.log('✅ collect-docs completed successfully')
        resolve()
      } else {
        console.error(`❌ collect-docs failed with exit code ${code}`)
        reject(new Error(`collect-docs exited with code ${code}`))
      }
    })

    child.on('error', err => {
      console.error('❌ Error running collect-docs:', err)
      reject(err)
    })
  })
}
