/**
 * ContextForge: Unified Storage & Obsidian Bridge Service
 * Browser-native local storage pairing (HTML5 File System Access API),
 * Multi-subfolder scanning, Vault signature detection,
 * Hierarchical Subfolder Scoping, and Obsidian URI protocol dispatching.
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

export interface DiscoveredSubfolder {
  path: string
  name: string
  filesCount: number
  hasObsidianVaultSignature: boolean
  suggestedType: 'obsidian_vault' | 'local_folder' | 'document_upload'
  files: File[]
  fileSampleNames: string[]
}

class ObsidianBridgeService {
  private activeDirectoryHandle: FileSystemDirectoryHandle | null = null
  private pairedVaultName: string =
    typeof window !== 'undefined'
      ? localStorage.getItem('contextforge_obsidian_vault_name') || ''
      : ''
  private pairedSubfolderScope: string =
    typeof window !== 'undefined'
      ? localStorage.getItem('contextforge_obsidian_subfolder_scope') || ''
      : ''

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
    if (!this.pairedVaultName && typeof window !== 'undefined') {
      this.pairedVaultName =
        localStorage.getItem('contextforge_obsidian_vault_name') || ''
    }
    return this.pairedVaultName
  }

  getPairedSubfolderScope(): string {
    if (!this.pairedSubfolderScope && typeof window !== 'undefined') {
      this.pairedSubfolderScope =
        localStorage.getItem('contextforge_obsidian_subfolder_scope') || ''
    }
    return this.pairedSubfolderScope
  }

  setPairedVault(vaultName: string, subfolderScope: string = ''): void {
    const cleanVault = (vaultName || '').trim()
    const cleanScope = (subfolderScope || '').trim()
    this.pairedVaultName = cleanVault
    this.pairedSubfolderScope = cleanScope
    if (typeof window !== 'undefined') {
      if (cleanVault) {
        localStorage.setItem('contextforge_obsidian_vault_name', cleanVault)
      }
      if (cleanScope) {
        localStorage.setItem('contextforge_obsidian_subfolder_scope', cleanScope)
      }
    }
  }

  /**
   * Parses standard or scoped Obsidian URI: obsidian://vault/{vaultName}/{subfolderPath}
   */
  parseObsidianUri(location: string): ParsedObsidianUri {
    const raw = location.replace(/^obsidian:\/\/vault\/?/, '').trim()
    if (!raw) {
      return { vaultName: this.getPairedVaultName(), subfolderScope: '', fullLocation: location }
    }

    const segments = raw.split('/').filter(Boolean)
    const vaultName = segments[0] || this.getPairedVaultName()
    const subfolderScope = segments.slice(1).join('/')

    return { vaultName, subfolderScope, fullLocation: location }
  }

  /**
   * Constructs standard or scoped Obsidian URI
   */
  buildObsidianUri(vaultName: string, subfolderScope?: string): string {
    const cleanVault = (vaultName || this.getPairedVaultName()).trim()
    const cleanScope = (subfolderScope || '').replace(/^\/+|\/+$/g, '').trim()
    if (!cleanVault) {
      return cleanScope ? `obsidian://open?file=${encodeURIComponent(cleanScope)}` : 'obsidian://open'
    }
    return cleanScope ? `obsidian://vault/${cleanVault}/${cleanScope}` : `obsidian://vault/${cleanVault}`
  }

  /**
   * Open OS directory picker to select a local root storage or folder
   */
  async requestDirectoryPicker(): Promise<{
    handle: FileSystemDirectoryHandle
    rootName: string
    subfolders: DiscoveredSubfolder[]
    rootFiles: File[]
  } | null> {
    if (!this.isFileSystemAccessSupported()) {
      return null
    }

    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker({ mode: 'readwrite' })

      this.activeDirectoryHandle = dirHandle
      const subfolders = await this.scanSubfolders(dirHandle)
      const rootFiles = await this.readDirectFiles(dirHandle)

      return {
        handle: dirHandle,
        rootName: dirHandle.name,
        subfolders,
        rootFiles,
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null
      }
      throw err
    }
  }

  /**
   * Scans immediate subfolders of a directory handle to discover granular knowledge sources
   */
  async scanSubfolders(dirHandle: FileSystemDirectoryHandle): Promise<DiscoveredSubfolder[]> {
    const subfolders: DiscoveredSubfolder[] = []

    try {
      const iterator =
        typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
          ? (dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
          : (dirHandle as unknown as AsyncIterable<FileSystemHandle>)

      for await (const entry of iterator) {
        if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
          const subDirHandle = entry as unknown as FileSystemDirectoryHandle
          const { files, hasObsidianSig, sampleNames } = await this.analyzeSubdirectory(subDirHandle)

          const isObsidian =
            hasObsidianSig ||
            entry.name.toLowerCase().includes('obsidian') ||
            entry.name.toLowerCase().includes('vault') ||
            entry.name.toLowerCase().includes('notes')

          subfolders.push({
            path: entry.name,
            name: this.formatFolderName(entry.name),
            filesCount: files.length,
            hasObsidianVaultSignature: isObsidian,
            suggestedType: isObsidian ? 'obsidian_vault' : 'local_folder',
            files,
            fileSampleNames: sampleNames,
          })
        }
      }
    } catch {
      // Fallback if iteration fails
    }

    return subfolders.sort((a, b) => b.filesCount - a.filesCount)
  }

  /**
   * Helper to format raw folder name into a pleasant Knowledge Source Title
   */
  private formatFolderName(raw: string): string {
    return raw
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  /**
   * Analyzes files inside a subdirectory recursively
   */
  private async analyzeSubdirectory(
    dirHandle: FileSystemDirectoryHandle,
    depth: number = 0,
  ): Promise<{ files: File[]; hasObsidianSig: boolean; sampleNames: string[] }> {
    const files: File[] = []
    const sampleNames: string[] = []
    let hasObsidianSig = false

    if (depth > 4) return { files, hasObsidianSig, sampleNames }

    try {
      const iterator =
        typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
          ? (dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
          : (dirHandle as unknown as AsyncIterable<FileSystemHandle>)

      for await (const entry of iterator) {
        if (entry.name === '.obsidian') {
          hasObsidianSig = true
        }

        if (entry.kind === 'file' && !entry.name.startsWith('.')) {
          const ext = entry.name.toLowerCase()
          if (
            ext.endsWith('.md') ||
            ext.endsWith('.txt') ||
            ext.endsWith('.pdf') ||
            ext.endsWith('.docx') ||
            ext.endsWith('.json') ||
            ext.endsWith('.csv') ||
            ext.endsWith('.ts') ||
            ext.endsWith('.js') ||
            ext.endsWith('.py') ||
            ext.endsWith('.sql')
          ) {
            const fileHandle = entry as unknown as FileSystemFileHandle
            const file = await fileHandle.getFile()
            files.push(file)
            if (sampleNames.length < 3) {
              sampleNames.push(entry.name)
            }
          }
        } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
          const sub = await this.analyzeSubdirectory(entry as unknown as FileSystemDirectoryHandle, depth + 1)
          files.push(...sub.files)
          if (sub.hasObsidianSig) hasObsidianSig = true
          if (sampleNames.length < 3) {
            sampleNames.push(...sub.sampleNames.slice(0, 3 - sampleNames.length))
          }
        }
      }
    } catch {
      // Catch permission or traversal issues
    }

    return { files, hasObsidianSig, sampleNames }
  }

  /**
   * Reads files directly in the root of the picked handle
   */
  private async readDirectFiles(dirHandle: FileSystemDirectoryHandle): Promise<File[]> {
    const files: File[] = []
    try {
      const iterator =
        typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
          ? (dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
          : (dirHandle as unknown as AsyncIterable<FileSystemHandle>)

      for await (const entry of iterator) {
        if (entry.kind === 'file' && !entry.name.startsWith('.')) {
          const fileHandle = entry as unknown as FileSystemFileHandle
          const file = await fileHandle.getFile()
          files.push(file)
        }
      }
    } catch {
      // Fallback
    }
    return files
  }

  /**
   * Groups a flat FileList (from webkitdirectory input) into DiscoveredSubfolders
   */
  groupWebkitFilesBySubfolder(fileList: File[]): {
    rootName: string
    subfolders: DiscoveredSubfolder[]
    rootFiles: File[]
  } {
    if (fileList.length === 0) {
      return { rootName: 'Local Storage', subfolders: [], rootFiles: [] }
    }

    const firstRel = (fileList[0] as unknown as { webkitRelativePath?: string }).webkitRelativePath || ''
    const rootName = firstRel.split('/')[0] || 'Local Storage'

    const folderMap = new Map<string, File[]>()
    const rootFiles: File[] = []

    for (const file of fileList) {
      const rel = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || file.name
      const segments = rel.split('/')

      if (segments.length > 2) {
        const subfolderName = segments[1]
        if (!folderMap.has(subfolderName)) {
          folderMap.set(subfolderName, [])
        }
        folderMap.get(subfolderName)!.push(file)
      } else {
        rootFiles.push(file)
      }
    }

    const subfolders: DiscoveredSubfolder[] = []
    for (const [subName, files] of folderMap.entries()) {
      const isObsidian =
        subName.toLowerCase().includes('obsidian') ||
        subName.toLowerCase().includes('vault') ||
        subName.toLowerCase().includes('notes') ||
        files.some((f) => f.name.endsWith('.md'))

      subfolders.push({
        path: subName,
        name: this.formatFolderName(subName),
        filesCount: files.length,
        hasObsidianVaultSignature: isObsidian,
        suggestedType: isObsidian ? 'obsidian_vault' : 'local_folder',
        files,
        fileSampleNames: files.slice(0, 3).map((f) => f.name),
      })
    }

    return { rootName, subfolders, rootFiles }
  }

  /**
   * Open OS directory picker to select a local Obsidian Vault or Sub-folder (Legacy direct helper)
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
   * Open folder/vault or specific note directly in Obsidian Desktop application via URI protocol
   */
  openInObsidianApp(
    vaultNameOrPath: string = '',
    filePath: string = '',
    content?: string,
  ): void {
    const rawTarget = (vaultNameOrPath || '').trim()
    const cleanVault = encodeURIComponent(rawTarget)
    const cleanFile = filePath
      ? encodeURIComponent(
          filePath
            .replace(/\.md$/, '')
            .replace(/^\/+/, '')
            .replace(/:\s*/g, ' - '),
        )
      : ''

    let uri: string

    if (cleanFile) {
      if (content) {
        const cleanContent = encodeURIComponent(content)
        uri = rawTarget
          ? `obsidian://new?vault=${cleanVault}&file=${cleanFile}&content=${cleanContent}`
          : `obsidian://new?file=${cleanFile}&content=${cleanContent}`
      } else {
        uri = rawTarget
          ? `obsidian://open?vault=${cleanVault}&file=${cleanFile}`
          : `obsidian://open?file=${cleanFile}`
      }
    } else {
      // Open Folder / Vault root directly in Obsidian Desktop
      uri = rawTarget
        ? `obsidian://open?vault=${cleanVault}`
        : `obsidian://open`
    }

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
