/**
 * ContextForge: Unified Storage & Obsidian Bridge Service
 * Bi-Directional WebSocket Browser Bridge, W3C File System Access API,
 * Dynamic Folder Discovery, Note Ingestion/Reading/Writing, and Obsidian URI protocol.
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

export interface BridgeRequestMessage {
  id: string
  type: 'mcp_bridge_request'
  action: string
  payload: Record<string, unknown>
  timestamp: number
}

export interface BridgeResponseMessage {
  id: string
  type: 'mcp_bridge_response'
  success: boolean
  data?: unknown
  error?: string
  timestamp: number
}

const IDB_NAME = 'contextforge_storage'
const IDB_STORE = 'vault_handles'
const IDB_KEY = 'paired_obsidian_handle'

async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null
  try {
    return await new Promise((resolve) => {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
      req.onsuccess = () => {
        const tx = req.result.transaction(IDB_STORE, 'readonly')
        const getReq = tx.objectStore(IDB_STORE).get(IDB_KEY)
        getReq.onsuccess = () => resolve(getReq.result || null)
        getReq.onerror = () => resolve(null)
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function persistDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(handle, IDB_KEY)
  } catch {
    // Ignore IDB errors
  }
}

class ObsidianBridgeService {
  private activeDirectoryHandle: FileSystemDirectoryHandle | null = null
  private pairedVaultName = typeof window !== 'undefined' ? localStorage.getItem('contextforge_obsidian_vault_name') || '' : ''
  private pairedSubfolderScope = typeof window !== 'undefined' ? localStorage.getItem('contextforge_obsidian_subfolder_scope') || '' : ''

  private bridgeSocket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private isConnecting = false

  constructor() {
    if (typeof window !== 'undefined') {
      getStoredDirectoryHandle().then((handle) => {
        if (handle) {
          this.activeDirectoryHandle = handle
          this.syncVaultStateToBackend()
        }
      })
      this.initBridgeSocket()
    }
  }

  // ==========================================
  // 1. WEBSOCKET RPC BRIDGE
  // ==========================================

  initBridgeSocket(): void {
    if (typeof window === 'undefined' || this.isConnecting) return
    if (this.bridgeSocket && this.bridgeSocket.readyState === WebSocket.OPEN) return

    this.isConnecting = true
    const host = window.location.hostname || 'localhost'
    const wsUrl = `ws://${host}:3001/api/obsidian-bridge/ws`

    try {
      this.bridgeSocket = new WebSocket(wsUrl)
      this.bridgeSocket.onopen = () => {
        this.isConnecting = false
        this.syncVaultStateToBackend()
      }
      this.bridgeSocket.onmessage = (evt) => {
        try {
          const req = JSON.parse(evt.data) as BridgeRequestMessage
          if (req && req.type === 'mcp_bridge_request' && req.id) {
            void this.handleBridgeRequest(req)
          }
        } catch {
          // ignore invalid parse
        }
      }
      this.bridgeSocket.onclose = () => {
        this.isConnecting = false
        this.scheduleReconnect()
      }
      this.bridgeSocket.onerror = () => {
        this.isConnecting = false
        if (this.bridgeSocket) this.bridgeSocket.close()
      }
    } catch {
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.initBridgeSocket()
    }, 4000)
  }

  async syncVaultStateToBackend(): Promise<void> {
    if (!this.bridgeSocket || this.bridgeSocket.readyState !== WebSocket.OPEN) return

    let folders: string[] = []
    let hasPermission = false

    if (this.activeDirectoryHandle) {
      hasPermission = await this.verifyHandlePermission(this.activeDirectoryHandle, 'read')
      if (hasPermission) {
        folders = await this.getFolderList('', true)
      }
    }

    this.bridgeSocket.send(
      JSON.stringify({
        type: 'mcp_bridge_sync_vault',
        vaultInfo: {
          connected: Boolean(this.activeDirectoryHandle && hasPermission),
          vaultName: this.getPairedVaultName() || this.activeDirectoryHandle?.name || 'Obsidian Vault',
          subfolderScope: this.getPairedSubfolderScope(),
          permissionGranted: hasPermission,
          foldersCount: folders.length,
          lastSyncedAt: new Date().toISOString(),
        },
        folders,
      }),
    )
  }

  private async handleBridgeRequest(req: BridgeRequestMessage): Promise<void> {
    try {
      let resultData: unknown

      switch (req.action) {
        case 'get_vault_info': {
          const hasPerm = this.activeDirectoryHandle ? await this.verifyHandlePermission(this.activeDirectoryHandle, 'read') : false
          resultData = {
            connected: Boolean(this.activeDirectoryHandle && hasPerm),
            vaultName: this.getPairedVaultName() || this.activeDirectoryHandle?.name || 'Obsidian Vault',
            subfolderScope: this.getPairedSubfolderScope(),
            permissionGranted: hasPerm,
            handleActive: Boolean(this.activeDirectoryHandle),
          }
          break
        }
        case 'list_folders': {
          const targetSubpath = (req.payload?.path as string) || ''
          const recursive = Boolean(req.payload?.recursive)
          const folders = await this.getFolderList(targetSubpath, recursive)
          resultData = { path: targetSubpath, folders, count: folders.length }
          break
        }
        case 'find_folder': {
          const query = ((req.payload?.query as string) || '').toLowerCase()
          const allFolders = await this.getFolderList('', true)
          resultData = { query, folders: allFolders.filter((f) => f.toLowerCase().includes(query)) }
          break
        }
        case 'create_folder': {
          const folderPath = (req.payload?.path as string) || ''
          await this.createFolderPathOnHandle(folderPath)
          await this.syncVaultStateToBackend()
          resultData = { success: true, path: folderPath, message: 'Folder created successfully' }
          break
        }
        case 'list_files': {
          const folderPath = (req.payload?.folderPath as string) || ''
          const extension = (req.payload?.extension as string) || ''
          const recursive = Boolean(req.payload?.recursive)
          resultData = await this.getFileList(folderPath, extension, recursive)
          break
        }
        case 'search_files': {
          const query = ((req.payload?.query as string) || '').toLowerCase()
          const folderPath = (req.payload?.folderPath as string) || ''
          resultData = await this.searchFilesInVault(query, folderPath)
          break
        }
        case 'read_note': {
          const filePath = (req.payload?.path as string) || ''
          const content = await this.readNoteContent(filePath)
          if (content === null) throw new Error(`Note not found at path: ${filePath}`)
          resultData = { path: filePath, content }
          break
        }
        case 'write_note': {
          const filePath = (req.payload?.path as string) || ''
          const content = (req.payload?.content as string) || ''
          const ok = await this.writeNoteToLocalVault(filePath, content)
          if (!ok) throw new Error(`Failed to write note to local vault at: ${filePath}`)
          resultData = { success: true, path: filePath }
          break
        }
        case 'delete_file': {
          const filePath = (req.payload?.path as string) || ''
          const ok = await this.deleteFileFromVault(filePath)
          if (!ok) throw new Error(`Failed to delete file from vault at: ${filePath}`)
          resultData = { success: true, path: filePath }
          break
        }
        case 'move_file': {
          const sourcePath = (req.payload?.sourcePath as string) || ''
          const targetPath = (req.payload?.targetPath as string) || ''
          const content = await this.readNoteContent(sourcePath)
          if (content === null) throw new Error(`Source note not found: ${sourcePath}`)
          await this.writeNoteToLocalVault(targetPath, content)
          await this.deleteFileFromVault(sourcePath)
          resultData = { success: true, sourcePath, targetPath }
          break
        }
        case 'search_backlinks': {
          const targetNote = ((req.payload?.targetNote as string) || '').toLowerCase()
          resultData = await this.findBacklinksInVault(targetNote)
          break
        }
        default:
          throw new Error(`Unsupported Bridge action: ${req.action}`)
      }

      this.sendBridgeResponse({ id: req.id, type: 'mcp_bridge_response', success: true, data: resultData, timestamp: Date.now() })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      this.sendBridgeResponse({ id: req.id, type: 'mcp_bridge_response', success: false, error: msg, timestamp: Date.now() })
    }
  }

  private sendBridgeResponse(res: BridgeResponseMessage) {
    if (this.bridgeSocket && this.bridgeSocket.readyState === WebSocket.OPEN) {
      this.bridgeSocket.send(JSON.stringify(res))
    }
  }

  // ==========================================
  // 2. VAULT FILE OPERATIONS
  // ==========================================

  private async getDirectoryFromPath(rootHandle: FileSystemDirectoryHandle, relativePath: string, createIfMissing = false): Promise<FileSystemDirectoryHandle | null> {
    const clean = relativePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
    if (!clean) return rootHandle

    const parts = clean.split('/').filter(Boolean)
    let current = rootHandle
    for (const part of parts) {
      try {
        current = await current.getDirectoryHandle(part, { create: createIfMissing })
      } catch {
        return null
      }
    }
    return current
  }

  async createFolderPathOnHandle(folderPath: string): Promise<boolean> {
    const rootHandle = await this.resolveActiveHandle()
    if (!rootHandle) throw new Error('No local Obsidian folder handle is paired.')
    await this.verifyHandlePermission(rootHandle, 'readwrite')
    return Boolean(await this.getDirectoryFromPath(rootHandle, folderPath, true))
  }

  private async getFolderList(targetSubpath = '', recursive = false): Promise<string[]> {
    const rootHandle = await this.resolveActiveHandle()
    if (!rootHandle) return []
    await this.verifyHandlePermission(rootHandle, 'read')

    const startDir = await this.getDirectoryFromPath(rootHandle, targetSubpath)
    if (!startDir) return []

    const folders: string[] = []
    const scan = async (dir: FileSystemDirectoryHandle, currentRel: string, depth = 0) => {
      if (!recursive && depth > 0) return
      if (depth > 6) return

      try {
        const iterator = typeof (dir as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
          ? (dir as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
          : (dir as unknown as AsyncIterable<FileSystemHandle>)

        for await (const entry of iterator) {
          if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
            const rel = currentRel ? `${currentRel}/${entry.name}` : entry.name
            folders.push(rel)
            if (recursive) {
              await scan(entry as unknown as FileSystemDirectoryHandle, rel, depth + 1)
            }
          }
        }
      } catch {
        // scan error catch
      }
    }

    await scan(startDir, targetSubpath, 0)
    return folders
  }

  private async getFileList(
    folderPath = '',
    extensionFilter = '',
    recursive = false,
  ): Promise<Array<{ path: string; name: string; extension: string; size: number; lastModified: number }>> {
    const rootHandle = await this.resolveActiveHandle()
    if (!rootHandle) return []
    await this.verifyHandlePermission(rootHandle, 'read')

    const startDir = await this.getDirectoryFromPath(rootHandle, folderPath)
    if (!startDir) return []

    const results: Array<{ path: string; name: string; extension: string; size: number; lastModified: number }> = []

    const scan = async (dir: FileSystemDirectoryHandle, currentRel: string, depth = 0) => {
      if (!recursive && depth > 0) return
      if (depth > 6) return

      try {
        const iterator = typeof (dir as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
          ? (dir as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
          : (dir as unknown as AsyncIterable<FileSystemHandle>)

        for await (const entry of iterator) {
          const rel = currentRel ? `${currentRel}/${entry.name}` : entry.name
          if (entry.kind === 'file' && !entry.name.startsWith('.')) {
            const ext = entry.name.includes('.') ? `.${entry.name.split('.').pop()?.toLowerCase()}` : ''
            if (!extensionFilter || ext === extensionFilter.toLowerCase()) {
              const fileHandle = entry as unknown as FileSystemFileHandle
              const file = await fileHandle.getFile()
              results.push({ path: rel, name: entry.name, extension: ext, size: file.size, lastModified: file.lastModified })
            }
          } else if (entry.kind === 'directory' && !entry.name.startsWith('.') && recursive) {
            await scan(entry as unknown as FileSystemDirectoryHandle, rel, depth + 1)
          }
        }
      } catch {
        // ignore
      }
    }

    await scan(startDir, folderPath, 0)
    return results
  }

  private async searchFilesInVault(query: string, folderPath = ''): Promise<Array<{ path: string; matchType: 'title' | 'content'; snippet?: string }>> {
    const rootHandle = await this.resolveActiveHandle()
    if (!rootHandle) return []
    await this.verifyHandlePermission(rootHandle, 'read')

    const matches: Array<{ path: string; matchType: 'title' | 'content'; snippet?: string }> = []
    const lowerQuery = query.toLowerCase()
    const files = await this.getFileList(folderPath, '.md', true)

    for (const f of files) {
      if (f.name.toLowerCase().includes(lowerQuery) || f.path.toLowerCase().includes(lowerQuery)) {
        matches.push({ path: f.path, matchType: 'title' })
        continue
      }
      const content = await this.readNoteContent(f.path)
      if (content && content.toLowerCase().includes(lowerQuery)) {
        const lines = content.split('\n')
        const matchLine = lines.find((l) => l.toLowerCase().includes(lowerQuery)) || ''
        matches.push({ path: f.path, matchType: 'content', snippet: matchLine.trim().slice(0, 140) })
      }
    }

    return matches
  }

  private async findBacklinksInVault(targetNote: string): Promise<Array<{ notePath: string; lineSnippet: string }>> {
    const rootHandle = await this.resolveActiveHandle()
    if (!rootHandle) return []
    await this.verifyHandlePermission(rootHandle, 'read')

    const cleanTarget = targetNote.replace(/\.md$/, '').toLowerCase()
    const wikilinkPattern = new RegExp(`\\[\\[([^\\]|#]+)(?:[|#][^\\]]+)?\\]\\]`, 'gi')
    const results: Array<{ notePath: string; lineSnippet: string }> = []
    const files = await this.getFileList('', '.md', true)

    for (const fileItem of files) {
      const content = await this.readNoteContent(fileItem.path)
      if (!content) continue

      const lines = content.split('\n')
      for (const line of lines) {
        let match: RegExpExecArray | null
        wikilinkPattern.lastIndex = 0
        while ((match = wikilinkPattern.exec(line)) !== null) {
          const linkedNote = (match[1] || '').trim().toLowerCase()
          if (linkedNote === cleanTarget || linkedNote.endsWith(`/${cleanTarget}`)) {
            results.push({ notePath: fileItem.path, lineSnippet: line.trim().slice(0, 160) })
            break
          }
        }
      }
    }

    return results
  }

  async readNoteContent(relativePath: string): Promise<string | null> {
    const rootHandle = await this.resolveActiveHandle()
    if (!rootHandle) return null
    await this.verifyHandlePermission(rootHandle, 'read')

    const clean = (relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '')
    const parts = clean.split('/').filter(Boolean)
    if (parts.length === 0) return null

    let currentDir = rootHandle
    for (let i = 0; i < parts.length - 1; i++) {
      try {
        currentDir = await currentDir.getDirectoryHandle(parts[i])
      } catch {
        return null
      }
    }

    try {
      const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1])
      const file = await fileHandle.getFile()
      return await file.text()
    } catch {
      return null
    }
  }

  async writeNoteToLocalVault(relativePath: string, content: string, dirHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    let targetHandle = dirHandle || this.activeDirectoryHandle
    if (!targetHandle) {
      targetHandle = await getStoredDirectoryHandle()
      if (targetHandle) this.activeDirectoryHandle = targetHandle
    }
    if (!targetHandle) return false

    try {
      await this.verifyHandlePermission(targetHandle, 'readwrite')
      const cleanRel = (relativePath || 'Note.md').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\0/g, '')
      const parts = cleanRel.split('/').filter(Boolean)
      let currentDir = targetHandle

      for (let i = 0; i < parts.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true })
      }

      const fileName = parts[parts.length - 1]
      const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
      const writable = await (fileHandle as unknown as { createWritable: () => Promise<FileSystemWritableFileStream> }).createWritable()
      await writable.write(content)
      await writable.close()
      return true
    } catch {
      return false
    }
  }

  async deleteFileFromVault(relativePath: string): Promise<boolean> {
    const rootHandle = await this.resolveActiveHandle()
    if (!rootHandle) return false
    await this.verifyHandlePermission(rootHandle, 'readwrite')

    const clean = (relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '')
    const parts = clean.split('/').filter(Boolean)
    if (parts.length === 0) return false

    let currentDir = rootHandle
    for (let i = 0; i < parts.length - 1; i++) {
      try {
        currentDir = await currentDir.getDirectoryHandle(parts[i])
      } catch {
        return false
      }
    }

    try {
      await currentDir.removeEntry(parts[parts.length - 1])
      return true
    } catch {
      return false
    }
  }

  // ==========================================
  // 3. UI PICKERS & STORAGE STATE
  // ==========================================

  private async resolveActiveHandle(): Promise<FileSystemDirectoryHandle | null> {
    if (this.activeDirectoryHandle) return this.activeDirectoryHandle
    const stored = await getStoredDirectoryHandle()
    if (stored) this.activeDirectoryHandle = stored
    return this.activeDirectoryHandle
  }

  isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window
  }

  getPairedDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.activeDirectoryHandle
  }

  getPairedVaultName(): string {
    if (!this.pairedVaultName && typeof window !== 'undefined') {
      this.pairedVaultName = localStorage.getItem('contextforge_obsidian_vault_name') || ''
    }
    return this.pairedVaultName
  }

  getPairedSubfolderScope(): string {
    if (!this.pairedSubfolderScope && typeof window !== 'undefined') {
      this.pairedSubfolderScope = localStorage.getItem('contextforge_obsidian_subfolder_scope') || ''
    }
    return this.pairedSubfolderScope
  }

  setPairedVault(vaultName: string, subfolderScope: string = ''): void {
    const cleanVault = (vaultName || '').trim()
    const cleanScope = (subfolderScope || '').trim()
    this.pairedVaultName = cleanVault
    this.pairedSubfolderScope = cleanScope
    if (typeof window !== 'undefined') {
      if (cleanVault) localStorage.setItem('contextforge_obsidian_vault_name', cleanVault)
      if (cleanScope) localStorage.setItem('contextforge_obsidian_subfolder_scope', cleanScope)
    }
    void this.syncVaultStateToBackend()
  }

  parseObsidianUri(location: string): ParsedObsidianUri {
    const raw = location.replace(/^obsidian:\/\/vault\/?/, '').trim()
    if (!raw) return { vaultName: this.getPairedVaultName(), subfolderScope: '', fullLocation: location }
    const segments = raw.split('/').filter(Boolean)
    return { vaultName: segments[0] || this.getPairedVaultName(), subfolderScope: segments.slice(1).join('/'), fullLocation: location }
  }

  buildObsidianUri(vaultName: string, subfolderScope?: string): string {
    const cleanVault = (vaultName || this.getPairedVaultName()).trim()
    const cleanScope = (subfolderScope || '').replace(/^\/+|\/+$/g, '').trim()
    if (!cleanVault) return cleanScope ? `obsidian://open?file=${encodeURIComponent(cleanScope)}` : 'obsidian://open'
    return cleanScope ? `obsidian://vault/${cleanVault}/${cleanScope}` : `obsidian://vault/${cleanVault}`
  }

  async requestDirectoryPicker(): Promise<{ handle: FileSystemDirectoryHandle; rootName: string; subfolders: DiscoveredSubfolder[]; rootFiles: File[] } | null> {
    if (!this.isFileSystemAccessSupported()) return null
    try {
      const dirHandle = await (window as unknown as { showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({ mode: 'readwrite' })
      this.activeDirectoryHandle = dirHandle
      await persistDirectoryHandle(dirHandle)
      const subfolders = await this.scanSubfolders(dirHandle)
      const rootFiles = await this.readDirectFiles(dirHandle)
      void this.syncVaultStateToBackend()
      return { handle: dirHandle, rootName: dirHandle.name, subfolders, rootFiles }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      throw err
    }
  }

  async scanSubfolders(dirHandle: FileSystemDirectoryHandle): Promise<DiscoveredSubfolder[]> {
    const subfolders: DiscoveredSubfolder[] = []
    try {
      const iterator = typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
        ? (dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
        : (dirHandle as unknown as AsyncIterable<FileSystemHandle>)

      for await (const entry of iterator) {
        if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
          const subDirHandle = entry as unknown as FileSystemDirectoryHandle
          const { files, hasObsidianSig, sampleNames } = await this.analyzeSubdirectory(subDirHandle)
          const isObsidian = hasObsidianSig || entry.name.toLowerCase().includes('obsidian') || entry.name.toLowerCase().includes('vault') || entry.name.toLowerCase().includes('notes')
          subfolders.push({
            path: entry.name,
            name: entry.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            filesCount: files.length,
            hasObsidianVaultSignature: isObsidian,
            suggestedType: isObsidian ? 'obsidian_vault' : 'local_folder',
            files,
            fileSampleNames: sampleNames,
          })
        }
      }
    } catch {
      // ignore
    }
    return subfolders.sort((a, b) => b.filesCount - a.filesCount)
  }

  private async analyzeSubdirectory(dirHandle: FileSystemDirectoryHandle, depth: number = 0): Promise<{ files: File[]; hasObsidianSig: boolean; sampleNames: string[] }> {
    const files: File[] = []
    const sampleNames: string[] = []
    let hasObsidianSig = false
    if (depth > 4) return { files, hasObsidianSig, sampleNames }

    try {
      const iterator = typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
        ? (dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
        : (dirHandle as unknown as AsyncIterable<FileSystemHandle>)

      for await (const entry of iterator) {
        if (entry.name === '.obsidian') hasObsidianSig = true
        if (entry.kind === 'file' && !entry.name.startsWith('.')) {
          const ext = entry.name.toLowerCase()
          if (['.md', '.txt', '.pdf', '.docx', '.json', '.csv', '.ts', '.js', '.py', '.sql'].some((e) => ext.endsWith(e))) {
            const fileHandle = entry as unknown as FileSystemFileHandle
            const file = await fileHandle.getFile()
            files.push(file)
            if (sampleNames.length < 3) sampleNames.push(entry.name)
          }
        } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
          const sub = await this.analyzeSubdirectory(entry as unknown as FileSystemDirectoryHandle, depth + 1)
          files.push(...sub.files)
          if (sub.hasObsidianSig) hasObsidianSig = true
          if (sampleNames.length < 3) sampleNames.push(...sub.sampleNames.slice(0, 3 - sampleNames.length))
        }
      }
    } catch {
      // ignore
    }
    return { files, hasObsidianSig, sampleNames }
  }

  private async readDirectFiles(dirHandle: FileSystemDirectoryHandle): Promise<File[]> {
    const files: File[] = []
    try {
      const iterator = typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
        ? (dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
        : (dirHandle as unknown as AsyncIterable<FileSystemHandle>)

      for await (const entry of iterator) {
        if (entry.kind === 'file' && !entry.name.startsWith('.')) {
          const fileHandle = entry as unknown as FileSystemFileHandle
          files.push(await fileHandle.getFile())
        }
      }
    } catch {
      // ignore
    }
    return files
  }

  async requestVaultDirectory(vaultName?: string, subfolderScope?: string): Promise<{ handle: FileSystemDirectoryHandle; files: VaultFileItem[] } | null> {
    if (!this.isFileSystemAccessSupported()) return null
    try {
      const dirHandle = await (window as unknown as { showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({ mode: 'readwrite' })
      this.activeDirectoryHandle = dirHandle
      this.pairedVaultName = vaultName || dirHandle.name
      this.pairedSubfolderScope = subfolderScope || ''
      await persistDirectoryHandle(dirHandle)
      void this.syncVaultStateToBackend()
      const files = await this.readMarkdownFilesFromDirectory(dirHandle)
      return { handle: dirHandle, files }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      throw err
    }
  }

  async readMarkdownFilesFromDirectory(dirHandle: FileSystemDirectoryHandle, basePath: string = ''): Promise<VaultFileItem[]> {
    const results: VaultFileItem[] = []
    try {
      const iterator = typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
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
          const subFiles = await this.readMarkdownFilesFromDirectory(entry as unknown as FileSystemDirectoryHandle, relPath)
          results.push(...subFiles)
        }
      }
    } catch {
      // ignore
    }
    return results
  }

  async verifyHandlePermission(handle?: FileSystemDirectoryHandle | null, mode: 'read' | 'readwrite' = 'readwrite'): Promise<boolean> {
    const targetHandle = handle || this.activeDirectoryHandle
    if (!targetHandle) return false
    try {
      const anyHandle = targetHandle as unknown as {
        queryPermission?: (opts: { mode: string }) => Promise<PermissionState>
        requestPermission?: (opts: { mode: string }) => Promise<PermissionState>
      }
      if (typeof anyHandle.queryPermission === 'function') {
        const state = await anyHandle.queryPermission({ mode })
        if (state === 'granted') return true
        if (state === 'prompt' && typeof anyHandle.requestPermission === 'function') {
          return (await anyHandle.requestPermission({ mode })) === 'granted'
        }
        return false
      }
      return true
    } catch {
      return false
    }
  }

  openInObsidianApp(vaultNameOrPath: string = '', filePath: string = '', content?: string): void {
    const rawTarget = (vaultNameOrPath || this.getPairedVaultName() || '').trim()
    const cleanVault = encodeURIComponent(rawTarget)
    const cleanFile = filePath ? encodeURIComponent(filePath.replace(/\.md$/, '').replace(/^\/+/, '').replace(/:\s*/g, ' - ')) : ''
    let uri: string

    if (cleanFile) {
      if (content) {
        uri = rawTarget
          ? `obsidian://new?vault=${cleanVault}&file=${cleanFile}&content=${encodeURIComponent(content)}`
          : `obsidian://new?file=${cleanFile}&content=${encodeURIComponent(content)}`
      } else {
        uri = rawTarget ? `obsidian://open?vault=${cleanVault}&file=${cleanFile}` : `obsidian://open?file=${cleanFile}`
      }
    } else {
      uri = rawTarget ? `obsidian://open?vault=${cleanVault}` : `obsidian://open`
    }
    window.location.href = uri
  }

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
