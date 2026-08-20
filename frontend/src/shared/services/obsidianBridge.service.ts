/**
 * ContextForge: Production-Ready Obsidian Bridge Service
 * Browser-native local vault pairing (HTML5 File System Access API),
 * Hierarchical Subfolder Scoping (obsidian://vault/VaultName/Subfolder),
 * Obsidian URI protocol dispatching, and fallback file export.
 */

export interface VaultFileItem {
  relativePath: string
  file: File
}

export interface ParsedObsidianUri {
  vaultName: string
  subfolderScope: string
  fullLocation: string
}

class ObsidianBridgeService {
  private activeDirectoryHandle: FileSystemDirectoryHandle | null = null
  private pairedVaultName: string = 'Engineering-HQ'
  private pairedSubfolderScope: string = ''

  /**
   * Check if browser supports HTML5 File System Access API (Chrome, Edge, Brave, Opera)
   */
  isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window
  }

  getPairedDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.activeDirectoryHandle
  }

  getPairedVaultName(): string {
    return this.pairedVaultName
  }

  getPairedSubfolderScope(): string {
    return this.pairedSubfolderScope
  }

  setPairedVault(vaultName: string, subfolderScope: string = ''): void {
    this.pairedVaultName = vaultName
    this.pairedSubfolderScope = subfolderScope
  }

  /**
   * Parses standard or scoped Obsidian URI: obsidian://vault/{vaultName}/{subfolderPath}
   */
  parseObsidianUri(location: string): ParsedObsidianUri {
    const raw = location.replace(/^obsidian:\/\/vault\/?/, '').trim()
    if (!raw) {
      return { vaultName: 'Engineering-HQ', subfolderScope: '', fullLocation: location }
    }

    const segments = raw.split('/').filter(Boolean)
    const vaultName = segments[0] || 'Engineering-HQ'
    const subfolderScope = segments.slice(1).join('/')

    return { vaultName, subfolderScope, fullLocation: location }
  }

  /**
   * Constructs standard or scoped Obsidian URI
   */
  buildObsidianUri(vaultName: string, subfolderScope?: string): string {
    const cleanVault = (vaultName || 'Engineering-HQ').trim()
    const cleanScope = (subfolderScope || '').replace(/^\/+|\/+$/g, '').trim()
    return cleanScope ? `obsidian://vault/${cleanVault}/${cleanScope}` : `obsidian://vault/${cleanVault}`
  }

  /**
   * Open OS directory picker to select a local Obsidian Vault or Sub-folder
   */
  async requestVaultDirectory(
    vaultName?: string,
    subfolderScope?: string,
  ): Promise<{
    handle: FileSystemDirectoryHandle
    files: VaultFileItem[]
  } | null> {
    if (!this.isFileSystemAccessSupported()) {
      return null
    }

    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker({ mode: 'readwrite' })

      this.activeDirectoryHandle = dirHandle
      this.pairedVaultName = vaultName || dirHandle.name
      this.pairedSubfolderScope = subfolderScope || ''

      const files = await this.readMarkdownFilesFromDirectory(dirHandle)
      return { handle: dirHandle, files }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null
      }
      throw err
    }
  }

  /**
   * Recursively scan directory handle for Markdown (.md) and text (.txt) files
   */
  async readMarkdownFilesFromDirectory(
    dirHandle: FileSystemDirectoryHandle,
    basePath: string = '',
  ): Promise<VaultFileItem[]> {
    const results: VaultFileItem[] = []

    try {
      // In W3C File System Access API, dirHandle.values() provides the async iterable
      const iterator =
        typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
          ? (dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
          : (dirHandle as unknown as AsyncIterable<FileSystemHandle>)

      for await (const entry of iterator) {
        const relPath = basePath ? `${basePath}/${entry.name}` : entry.name

        if (entry.kind === 'file') {
          const ext = entry.name.toLowerCase()
          if (ext.endsWith('.md') || ext.endsWith('.txt')) {
            const fileHandle = entry as unknown as FileSystemFileHandle
            const file = await fileHandle.getFile()
            results.push({ relativePath: relPath, file })
          }
        } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
          const subDirHandle = entry as unknown as FileSystemDirectoryHandle
          const subFiles = await this.readMarkdownFilesFromDirectory(subDirHandle, relPath)
          results.push(...subFiles)
        }
      }
    } catch {
      // Fallback
    }

    return results
  }

  /**
   * Write or update a Markdown note directly to the paired local Obsidian Vault / Subfolder on disk
   */
  async writeNoteToLocalVault(
    relativePath: string,
    content: string,
    dirHandle?: FileSystemDirectoryHandle,
  ): Promise<boolean> {
    const targetHandle = dirHandle || this.activeDirectoryHandle
    if (!targetHandle) {
      return false
    }

    try {
      const parts = relativePath.split('/').filter(Boolean)
      let currentDir = targetHandle

      // Traverse / create subdirectories if needed
      for (let i = 0; i < parts.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true })
      }

      const fileName = parts[parts.length - 1]
      const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
      const writable = await (fileHandle as unknown as {
        createWritable: () => Promise<FileSystemWritableFileStream>
      }).createWritable()

      await writable.write(content)
      await writable.close()
      return true
    } catch {
      return false
    }
  }

  /**
   * Open / Create note directly in the local Obsidian desktop application via URI protocol
   * Respects subfolder scoping (e.g. file=Architecture/auth-v2)
   */
  openInObsidianApp(
    vaultName: string,
    filePath: string,
    content?: string,
    subfolderScope?: string,
  ): void {
    const cleanVault = encodeURIComponent(vaultName || this.pairedVaultName || 'Engineering-HQ')

    let targetFile = filePath.replace(/\.md$/, '').replace(/^\/+/, '')
    const scope = (subfolderScope || this.pairedSubfolderScope || '').replace(/^\/+|\/+$/g, '')

    // Prefix subfolder scope if not already in filePath
    if (scope && !targetFile.startsWith(scope)) {
      targetFile = `${scope}/${targetFile}`
    }

    const cleanFile = encodeURIComponent(targetFile)

    let uri = `obsidian://open?vault=${cleanVault}&file=${cleanFile}`

    if (content) {
      const cleanContent = encodeURIComponent(content)
      uri = `obsidian://new?vault=${cleanVault}&file=${cleanFile}&content=${cleanContent}`
    }

    // Open Obsidian Desktop protocol
    window.location.href = uri
  }

  /**
   * Export / Download note as a standalone .md file (Universal fallback)
   */
  downloadMarkdownFile(fileName: string, content: string): void {
    const cleanName = fileName.endsWith('.md') ? fileName : `${fileName}.md`
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = cleanName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const obsidianBridgeService = new ObsidianBridgeService()
