/**
 * ContextForge: Unified Storage & Obsidian Bridge Service
 * Bi-Directional WebSocket Browser Bridge, W3C File System Access API,
 * Dynamic Folder Discovery, Note Ingestion/Reading/Writing, and Obsidian URI protocol.
 */

import type {
  VaultFileItem,
  ParsedObsidianUri,
  DiscoveredSubfolder,
  BridgeRequestMessage,
  BridgeResponseMessage,
} from './obsidian/obsidian.types'

import {
  getStoredDirectoryHandle,
  persistDirectoryHandle,
  clearStoredDirectoryHandle,
  verifyHandlePermission,
} from './obsidian/obsidianStorage'

import * as fs from './obsidian/obsidianFileSystem'

export * from './obsidian/obsidian.types'
export { verifyHandlePermission }

class ObsidianBridgeService {
  private activeDirectoryHandle: FileSystemDirectoryHandle | null = null
  private inMemoryHandles: Map<string, FileSystemDirectoryHandle> = new Map()
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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.port === '5173' ? `${window.location.hostname}:3001` : window.location.host
    const wsUrl = `${protocol}//${host}/api/obsidian-bridge/ws`

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
      hasPermission = await verifyHandlePermission(this.activeDirectoryHandle, 'read')
      if (hasPermission) {
        folders = await fs.getFolderList(this.activeDirectoryHandle, '', true)
      }
    }

    const isConnected = Boolean(this.activeDirectoryHandle && hasPermission)
    const vaultName = isConnected
      ? this.getPairedVaultName() || this.activeDirectoryHandle?.name || 'Obsidian Vault'
      : ''

    this.bridgeSocket.send(
      JSON.stringify({
        type: 'mcp_bridge_sync_vault',
        vaultInfo: {
          connected: isConnected,
          vaultName: vaultName,
          subfolderScope: isConnected ? this.getPairedSubfolderScope() : '',
          permissionGranted: hasPermission,
          foldersCount: folders.length,
          lastSyncedAt: new Date().toISOString(),
        },
        folders,
      }),
    )
  }

  private async handleBridgeRequest(req: BridgeRequestMessage): Promise<void> {
    const handle = await this.resolveActiveHandle()
    try {
      let resultData: unknown

      switch (req.action) {
        case 'get_vault_info': {
          const hasPerm = handle ? await verifyHandlePermission(handle, 'read') : false
          resultData = {
            connected: Boolean(handle && hasPerm),
            vaultName: this.getPairedVaultName() || handle?.name || 'Obsidian Vault',
            subfolderScope: this.getPairedSubfolderScope(),
            permissionGranted: hasPerm,
            handleActive: Boolean(handle),
          }
          break
        }
        case 'list_folders': {
          if (!handle) throw new Error('No local vault paired')
          const targetSubpath = (req.payload?.path as string) || ''
          const recursive = Boolean(req.payload?.recursive)
          const folders = await fs.getFolderList(handle, targetSubpath, recursive)
          resultData = { path: targetSubpath, folders, count: folders.length }
          break
        }
        case 'find_folder': {
          if (!handle) throw new Error('No local vault paired')
          const query = ((req.payload?.query as string) || '').toLowerCase()
          const allFolders = await fs.getFolderList(handle, '', true)
          resultData = { query, folders: allFolders.filter((f) => f.toLowerCase().includes(query)) }
          break
        }
        case 'create_folder': {
          if (!handle) throw new Error('No local vault paired')
          const folderPath = (req.payload?.path as string) || ''
          await fs.createFolderPathOnHandle(handle, folderPath)
          await this.syncVaultStateToBackend()
          resultData = { success: true, path: folderPath, message: 'Folder created successfully' }
          break
        }
        case 'list_files': {
          if (!handle) throw new Error('No local vault paired')
          const folderPath = (req.payload?.folderPath as string) || ''
          const extension = (req.payload?.extension as string) || ''
          const recursive = Boolean(req.payload?.recursive)
          resultData = await fs.getFileList(handle, folderPath, extension, recursive)
          break
        }
        case 'search_files': {
          if (!handle) throw new Error('No local vault paired')
          const query = ((req.payload?.query as string) || '').toLowerCase()
          const folderPath = (req.payload?.folderPath as string) || ''
          resultData = await fs.searchFilesInVault(handle, query, folderPath)
          break
        }
        case 'read_note': {
          if (!handle) throw new Error('No local vault paired')
          const filePath = (req.payload?.path as string) || ''
          const content = await fs.readNoteContent(handle, filePath)
          if (content === null) throw new Error(`Note not found at path: ${filePath}`)
          resultData = { path: filePath, content }
          break
        }
        case 'write_note': {
          if (!handle) throw new Error('No local vault paired')
          const filePath = (req.payload?.path as string) || ''
          const content = (req.payload?.content as string) || ''
          const ok = await fs.writeNoteToLocalVault(handle, filePath, content)
          if (!ok) throw new Error(`Failed to write note to local vault at: ${filePath}`)
          resultData = { success: true, path: filePath }
          break
        }
        case 'delete_file': {
          if (!handle) throw new Error('No local vault paired')
          const filePath = (req.payload?.path as string) || ''
          const ok = await fs.deleteFileFromVault(handle, filePath)
          if (!ok) throw new Error(`Failed to delete file from vault at: ${filePath}`)
          resultData = { success: true, path: filePath }
          break
        }
        case 'move_file': {
          if (!handle) throw new Error('No local vault paired')
          const sourcePath = (req.payload?.sourcePath as string) || ''
          const targetPath = (req.payload?.targetPath as string) || ''
          const content = await fs.readNoteContent(handle, sourcePath)
          if (content === null) throw new Error(`Source note not found: ${sourcePath}`)
          await fs.writeNoteToLocalVault(handle, targetPath, content)
          await fs.deleteFileFromVault(handle, sourcePath)
          resultData = { success: true, sourcePath, targetPath }
          break
        }
        case 'search_backlinks': {
          if (!handle) throw new Error('No local vault paired')
          const targetNote = ((req.payload?.targetNote as string) || '').toLowerCase()
          resultData = await fs.findBacklinksInVault(handle, targetNote)
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
  // 2. PUBLIC HANDLE & VAULT METHODS
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

  setPairedVault(vaultName: string, subfolderScope = ''): void {
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

  async unpairVault(): Promise<void> {
    this.activeDirectoryHandle = null
    this.pairedVaultName = ''
    this.pairedSubfolderScope = ''
    this.inMemoryHandles.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('contextforge_obsidian_vault_name')
      localStorage.removeItem('contextforge_obsidian_subfolder_scope')
    }
    await clearStoredDirectoryHandle()
    await this.syncVaultStateToBackend()
  }

  parseObsidianUri(location: string): ParsedObsidianUri {
    return fs.parseObsidianUri(location, this.getPairedVaultName())
  }

  buildObsidianUri(vaultName: string, subfolderScope?: string): string {
    return fs.buildObsidianUri(vaultName || this.getPairedVaultName(), subfolderScope)
  }

  async requestDirectoryPicker(): Promise<{
    handle: FileSystemDirectoryHandle
    rootName: string
    subfolders: DiscoveredSubfolder[]
    rootFiles: File[]
  } | null> {
    if (!this.isFileSystemAccessSupported()) return null
    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker({ mode: 'readwrite' })
      this.activeDirectoryHandle = dirHandle
      await persistDirectoryHandle(dirHandle)
      const subfolders = await fs.scanSubfolders(dirHandle)
      const rootFiles = await fs.readDirectFiles(dirHandle)
      void this.syncVaultStateToBackend()
      return { handle: dirHandle, rootName: dirHandle.name, subfolders, rootFiles }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      throw err
    }
  }

  async requestVaultDirectory(
    vaultName?: string,
    subfolderScope?: string,
  ): Promise<{ handle: FileSystemDirectoryHandle; files: VaultFileItem[] } | null> {
    if (!this.isFileSystemAccessSupported()) return null
    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker({ mode: 'readwrite' })
      this.activeDirectoryHandle = dirHandle
      this.pairedVaultName = vaultName || dirHandle.name
      this.pairedSubfolderScope = subfolderScope || ''
      await persistDirectoryHandle(dirHandle)
      void this.syncVaultStateToBackend()
      const files = await fs.readMarkdownFilesFromDirectory(dirHandle)
      return { handle: dirHandle, files }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      throw err
    }
  }

  async readNoteContent(relativePath: string): Promise<string | null> {
    const handle = await this.resolveActiveHandle()
    if (!handle) return null
    return fs.readNoteContent(handle, relativePath)
  }

  async writeNoteToLocalVault(
    relativePath: string,
    content: string,
    dirHandle?: FileSystemDirectoryHandle,
  ): Promise<boolean> {
    let targetHandle = dirHandle || this.activeDirectoryHandle
    if (!targetHandle) {
      targetHandle = await getStoredDirectoryHandle()
      if (targetHandle) this.activeDirectoryHandle = targetHandle
    }
    if (!targetHandle) return false
    return fs.writeNoteToLocalVault(targetHandle, relativePath, content)
  }

  async deleteFileFromVault(relativePath: string): Promise<boolean> {
    const handle = await this.resolveActiveHandle()
    if (!handle) return false
    return fs.deleteFileFromVault(handle, relativePath)
  }

  openInObsidianApp(vaultNameOrPath = '', filePath = '', content?: string): void {
    fs.openInObsidianApp(vaultNameOrPath || this.getPairedVaultName(), filePath, content)
  }

  downloadMarkdownFile(fileName: string, content: string): void {
    fs.downloadMarkdownFile(fileName, content)
  }

  async storeDirectoryHandle(
    sourceId: string,
    folderName: string,
    handle: FileSystemDirectoryHandle,
  ): Promise<void> {
    this.activeDirectoryHandle = handle
    this.inMemoryHandles.set(sourceId, handle)
    this.inMemoryHandles.set(folderName.toLowerCase(), handle)
    await persistDirectoryHandle(handle)
    void this.syncVaultStateToBackend()
  }

  async getDirectoryHandle(sourceIdentifier?: string): Promise<FileSystemDirectoryHandle | null> {
    if (!sourceIdentifier) return this.resolveActiveHandle()
    if (this.inMemoryHandles.has(sourceIdentifier)) {
      return this.inMemoryHandles.get(sourceIdentifier)!
    }
    const lower = sourceIdentifier.toLowerCase()
    if (this.inMemoryHandles.has(lower)) {
      return this.inMemoryHandles.get(lower)!
    }
    return this.resolveActiveHandle()
  }

  async scanModifiedFiles(sourceIdentifier: string, lastSyncedIso?: string): Promise<File[]> {
    const handle = await this.getDirectoryHandle(sourceIdentifier)
    if (!handle) return []

    const minTimestamp = lastSyncedIso ? new Date(lastSyncedIso).getTime() : 0
    const files = await fs.readMarkdownFilesFromDirectory(handle)
    return files
      .map((f) => f.file)
      .filter((file) => file.lastModified > minTimestamp)
  }

  async verifyHandlePermission(
    handle?: FileSystemDirectoryHandle | null,
    mode: 'read' | 'readwrite' = 'readwrite',
  ): Promise<boolean> {
    return verifyHandlePermission(handle || this.activeDirectoryHandle, mode)
  }
}

export const obsidianBridgeService = new ObsidianBridgeService()
export { ObsidianBridgeService }
