/**
 * ContextForge Browser Storage Bridge Service
 * Implements W3C File System Access API with IndexedDB handle persistence,
 * direct disk write-back, and bi-directional delta synchronization.
 */

const DB_NAME = 'contextforge_storage_db'
const DB_VERSION = 1
const STORE_NAME = 'directory_handles'

export interface StoredHandleMeta {
  sourceId: string
  folderName: string
  handle: FileSystemDirectoryHandle
  savedAt: string
}

export interface DiskWriteResult {
  success: boolean
  folderName: string
  relativePath: string
  bytesWritten: number
  error?: string
}

export type DiskWriteListener = (result: DiskWriteResult) => void

class BrowserStorageBridgeService {
  private inMemoryHandles: Map<string, FileSystemDirectoryHandle> = new Map()
  private writeListeners: Set<DiskWriteListener> = new Set()
  private dbPromise: Promise<IDBDatabase> | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDb()
    }
  }

  private initDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'sourceId' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    return this.dbPromise
  }

  /**
   * Register a listener for local disk write events (for toasts / notifications)
   */
  onDiskWrite(listener: DiskWriteListener): () => void {
    this.writeListeners.add(listener)
    return () => this.writeListeners.delete(listener)
  }

  private notifyWrite(result: DiskWriteResult) {
    this.writeListeners.forEach((l) => {
      try {
        l(result)
      } catch {
        // Safe listener execution
      }
    })
  }

  /**
   * Store directory handle in memory and persist in IndexedDB
   */
  async storeDirectoryHandle(
    sourceId: string,
    folderName: string,
    handle: FileSystemDirectoryHandle
  ): Promise<void> {
    this.inMemoryHandles.set(sourceId, handle)
    this.inMemoryHandles.set(folderName.toLowerCase(), handle)

    try {
      const db = await this.initDb()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put({
        sourceId,
        folderName,
        handle,
        savedAt: new Date().toISOString(),
      })
    } catch {
      // IndexedDB persistence fallback (in-memory will still work)
    }
  }

  /**
   * Retrieve handle from in-memory cache or IndexedDB
   */
  async getDirectoryHandle(sourceIdentifier: string): Promise<FileSystemDirectoryHandle | null> {
    // 1. Check in-memory map first
    if (this.inMemoryHandles.has(sourceIdentifier)) {
      return this.inMemoryHandles.get(sourceIdentifier)!
    }
    const lower = sourceIdentifier.toLowerCase()
    if (this.inMemoryHandles.has(lower)) {
      return this.inMemoryHandles.get(lower)!
    }

    // 2. Search in IndexedDB
    try {
      const db = await this.initDb()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)

      return new Promise<FileSystemDirectoryHandle | null>((resolve) => {
        const req = store.get(sourceIdentifier)
        req.onsuccess = () => {
          const record = req.result as StoredHandleMeta | undefined
          if (record && record.handle) {
            this.inMemoryHandles.set(sourceIdentifier, record.handle)
            this.inMemoryHandles.set(record.folderName.toLowerCase(), record.handle)
            resolve(record.handle)
          } else {
            // Check all records if matched by folder name
            const allReq = store.getAll()
            allReq.onsuccess = () => {
              const all = allReq.result as StoredHandleMeta[]
              const found = all.find(
                (r) =>
                  r.folderName.toLowerCase() === lower ||
                  lower.includes(r.folderName.toLowerCase()) ||
                  r.folderName.toLowerCase().includes(lower)
              )
              if (found) {
                this.inMemoryHandles.set(sourceIdentifier, found.handle)
                resolve(found.handle)
              } else {
                resolve(null)
              }
            }
            allReq.onerror = () => resolve(null)
          }
        }
        req.onerror = () => resolve(null)
      })
    } catch {
      return null
    }
  }

  /**
   * Returns any primary active handle (first available)
   */
  async getPrimaryHandle(): Promise<{ name: string; handle: FileSystemDirectoryHandle } | null> {
    if (this.inMemoryHandles.size > 0) {
      for (const [key, handle] of this.inMemoryHandles.entries()) {
        return { name: handle.name || key, handle }
      }
    }

    try {
      const db = await this.initDb()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)

      return new Promise((resolve) => {
        const allReq = store.getAll()
        allReq.onsuccess = () => {
          const all = allReq.result as StoredHandleMeta[]
          if (all.length > 0) {
            const first = all[0]
            this.inMemoryHandles.set(first.sourceId, first.handle)
            resolve({ name: first.folderName, handle: first.handle })
          } else {
            resolve(null)
          }
        }
        allReq.onerror = () => resolve(null)
      })
    } catch {
      return null
    }
  }

  /**
   * Verify readwrite permission for a handle
   */
  async verifyPermission(
    handle: FileSystemDirectoryHandle,
    mode: 'read' | 'readwrite' = 'readwrite'
  ): Promise<boolean> {
    try {
      const queryResult = await (handle as unknown as {
        queryPermission: (opts: { mode: string }) => Promise<PermissionState>
      }).queryPermission({ mode })

      if (queryResult === 'granted') return true

      const requestResult = await (handle as unknown as {
        requestPermission: (opts: { mode: string }) => Promise<PermissionState>
      }).requestPermission({ mode })

      return requestResult === 'granted'
    } catch {
      return false
    }
  }

  /**
   * Direct Disk Write-Back (Scenario B)
   * Writes file directly to user's laptop storage
   */
  async writeDocument(
    targetScopeOrSource: string,
    relativePath: string,
    content: string
  ): Promise<DiskWriteResult> {
    const handle =
      (await this.getDirectoryHandle(targetScopeOrSource)) ||
      (await this.getPrimaryHandle())?.handle

    if (!handle) {
      return {
        success: false,
        folderName: targetScopeOrSource,
        relativePath,
        bytesWritten: 0,
        error: 'No active local folder handle found in browser session.',
      }
    }

    const hasPermission = await this.verifyPermission(handle, 'readwrite')
    if (!hasPermission) {
      return {
        success: false,
        folderName: handle.name,
        relativePath,
        bytesWritten: 0,
        error: 'Permission denied to write to local directory.',
      }
    }

    try {
      const cleanPath = relativePath.replace(/^[/\\]+/, '').replace(/\0/g, '')
      const parts = cleanPath.split('/').filter(Boolean)
      let currentDir = handle

      // Create nested subdirectories if needed
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

      const bytesWritten = new Blob([content]).size
      const result: DiskWriteResult = {
        success: true,
        folderName: handle.name,
        relativePath: cleanPath,
        bytesWritten,
      }

      this.notifyWrite(result)
      return result
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        folderName: handle.name,
        relativePath,
        bytesWritten: 0,
        error: errorMsg,
      }
    }
  }

  /**
   * Scans a paired folder for modified / new files since lastSyncedIso (Delta Sync)
   */
  async scanModifiedFiles(
    sourceIdentifier: string,
    lastSyncedIso?: string
  ): Promise<File[]> {
    const handle =
      (await this.getDirectoryHandle(sourceIdentifier)) ||
      (await this.getPrimaryHandle())?.handle

    if (!handle) return []

    const minTimestamp = lastSyncedIso ? new Date(lastSyncedIso).getTime() : 0
    const modifiedFiles: File[] = []

    await this.scanDirRecursive(handle, (file) => {
      if (file.lastModified > minTimestamp) {
        modifiedFiles.push(file)
      }
    })

    return modifiedFiles
  }

  private async scanDirRecursive(
    dirHandle: FileSystemDirectoryHandle,
    onFile: (file: File) => void,
    depth = 0
  ): Promise<void> {
    if (depth > 5) return

    try {
      const iterator =
        typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
          ? (dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
          : (dirHandle as unknown as AsyncIterable<FileSystemHandle>)

      for await (const entry of iterator) {
        if (entry.name.startsWith('.')) continue

        if (entry.kind === 'file') {
          const ext = entry.name.toLowerCase()
          if (
            ext.endsWith('.md') ||
            ext.endsWith('.txt') ||
            ext.endsWith('.json') ||
            ext.endsWith('.csv') ||
            ext.endsWith('.ts') ||
            ext.endsWith('.tsx') ||
            ext.endsWith('.py') ||
            ext.endsWith('.sql')
          ) {
            const fileHandle = entry as unknown as FileSystemFileHandle
            const file = await fileHandle.getFile()
            onFile(file)
          }
        } else if (entry.kind === 'directory') {
          await this.scanDirRecursive(
            entry as unknown as FileSystemDirectoryHandle,
            onFile,
            depth + 1
          )
        }
      }
    } catch {
      // Catch permission or boundary errors
    }
  }
}

export const browserStorageBridge = new BrowserStorageBridgeService()
