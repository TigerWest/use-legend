import * as ts from 'typescript'

export function extractTypeDeclarations(sourceFilePath: string): string {
  try {
    let declarationContent = ''

    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      declaration: true,
      emitDeclarationOnly: true,
      skipLibCheck: true,
    }

    const host = ts.createCompilerHost(compilerOptions)
    host.writeFile = (fileName, content) => {
      if (fileName.endsWith('.d.ts')) declarationContent = content
    }

    const program = ts.createProgram([sourceFilePath], compilerOptions, host)
    program.emit()

    return declarationContent
      .replace(/\/\*\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .split('\n')
      .filter(
        line =>
          !line.startsWith('/// ') &&
          !line.trim().startsWith('import ') &&
          line.trim() !== 'export {};' &&
          line.trim() !== ''
      )
      .join('\n')
      .trim()
  } catch {
    return ''
  }
}
