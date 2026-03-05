import * as fs from 'fs/promises'
import * as path from 'path'
import { DOCS_ENABLE_NATIVE_TAB, NATIVE_INDEX_OUTPUT_PATH, NATIVE_INDEX_TEMPLATE_PATH } from './config'

export async function syncNativeLandingPage(): Promise<void> {
  if (!DOCS_ENABLE_NATIVE_TAB) {
    await fs.rm(NATIVE_INDEX_OUTPUT_PATH, { force: true })
    return
  }

  await fs.mkdir(path.dirname(NATIVE_INDEX_OUTPUT_PATH), { recursive: true })
  await fs.copyFile(NATIVE_INDEX_TEMPLATE_PATH, NATIVE_INDEX_OUTPUT_PATH)
}
