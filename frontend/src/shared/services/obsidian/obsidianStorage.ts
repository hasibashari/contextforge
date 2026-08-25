const IDB_NAME = 'contextforge_storage'
const IDB_STORE = 'vault_handles'
const IDB_KEY = 'paired_obsidian_handle'

export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
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

export async function clearStoredDirectoryHandle(): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(IDB_KEY)
  } catch {
    // Ignore IDB errors
  }
}

export async function persistDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
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

export async function verifyHandlePermission(
  handle: FileSystemDirectoryHandle | null,
  mode: 'read' | 'readwrite' = 'readwrite',
): Promise<boolean> {
  if (!handle) return false
  try {
    const anyHandle = handle as unknown as {
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
