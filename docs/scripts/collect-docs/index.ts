import { DOCS_ENABLE_NATIVE_TAB } from './config'
import { cleanLegacyDirectories, cleanSectionDirectory } from './clean-output'
import { scanSourceFiles } from './scan-source-files'
import { syncNativeLandingPage } from './sync-native-landing-page'
import { checkDuplicateTargets, toGeneratedDocs } from './to-generated-docs'
import { writePackageDocs } from './write-package-docs'

export async function runCollectDocs(): Promise<void> {
  console.log('🚀 Collecting documentation files...\n')
  console.log(`   DOCS_ENABLE_NATIVE_TAB=${DOCS_ENABLE_NATIVE_TAB ? '1' : '0'}`)

  try {
    const sourceDocs = await scanSourceFiles()
    const generatedDocs = toGeneratedDocs(sourceDocs)
    checkDuplicateTargets(generatedDocs)

    await Promise.all([
      cleanSectionDirectory('core'),
      cleanSectionDirectory('web'),
      cleanSectionDirectory('native'),
      cleanSectionDirectory('integrations'),
      cleanLegacyDirectories(),
    ])

    await writePackageDocs(generatedDocs)
    await syncNativeLandingPage()

    console.log('\n✨ Documentation collection complete!\n')
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}
