import type {
  VaultFileItem,
  DiscoveredSubfolder,
  VaultFileInfo,
  FileMatchResult,
  BacklinkResult,
  ParsedObsidianUri,
} from './obsidian.types'
import { verifyHandlePermission } from './obsidianStorage'

export async function getDirectoryFromPath(
  rootHandle: FileSystemDirectoryHandle,
  relativePath: string,
  createIfMissing = false,
): Promise<FileSystemDirectoryHandle | null> {
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

export async function createFolderPathOnHandle(
  rootHandle: FileSystemDirectoryHandle,
  folderPath: string,
): Promise<boolean> {
  await verifyHandlePermission(rootHandle, 'readwrite')
  return Boolean(await getDirectoryFromPath(rootHandle, folderPath, true))
}

export async function getFolderList(
  rootHandle: FileSystemDirectoryHandle,
  targetSubpath = '',
  recursive = false,
): Promise<string[]> {
  await verifyHandlePermission(rootHandle, 'read')

  const startDir = await getDirectoryFromPath(rootHandle, targetSubpath)
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

export async function getFileList(
  rootHandle: FileSystemDirectoryHandle,
  folderPath = '',
  extensionFilter = '',
  recursive = false,
): Promise<VaultFileInfo[]> {
  await verifyHandlePermission(rootHandle, 'read')

  const startDir = await getDirectoryFromPath(rootHandle, folderPath)
  if (!startDir) return []

  const results: VaultFileInfo[] = []

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

export async function searchFilesInVault(
  rootHandle: FileSystemDirectoryHandle,
  query: string,
  folderPath = '',
): Promise<FileMatchResult[]> {
  await verifyHandlePermission(rootHandle, 'read')

  const matches: FileMatchResult[] = []
  const lowerQuery = query.toLowerCase()
  const files = await getFileList(rootHandle, folderPath, '.md', true)

  for (const f of files) {
    if (f.name.toLowerCase().includes(lowerQuery) || f.path.toLowerCase().includes(lowerQuery)) {
      matches.push({ path: f.path, matchType: 'title' })
      continue
    }
    const content = await readNoteContent(rootHandle, f.path)
    if (content && content.toLowerCase().includes(lowerQuery)) {
      const lines = content.split('\n')
      const matchLine = lines.find((l) => l.toLowerCase().includes(lowerQuery)) || ''
      matches.push({ path: f.path, matchType: 'content', snippet: matchLine.trim().slice(0, 140) })
    }
  }

  return matches
}

export async function findBacklinksInVault(
  rootHandle: FileSystemDirectoryHandle,
  targetNote: string,
): Promise<BacklinkResult[]> {
  await verifyHandlePermission(rootHandle, 'read')

  const cleanTarget = targetNote.replace(/\.md$/, '').toLowerCase()
  const wikilinkPattern = new RegExp(`\\[\\[([^\\]|#]+)(?:[|#][^\\]]+)?\\]\\]`, 'gi')
  const results: BacklinkResult[] = []
  const files = await getFileList(rootHandle, '', '.md', true)

  for (const fileItem of files) {
    const content = await readNoteContent(rootHandle, fileItem.path)
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

export async function readNoteContent(
  rootHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<string | null> {
  await verifyHandlePermission(rootHandle, 'read')

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

export async function writeNoteToLocalVault(
  targetHandle: FileSystemDirectoryHandle,
  relativePath: string,
  content: string,
): Promise<boolean> {
  try {
    await verifyHandlePermission(targetHandle, 'readwrite')
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

export async function deleteFileFromVault(
  rootHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<boolean> {
  await verifyHandlePermission(rootHandle, 'readwrite')

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

export async function scanSubfolders(dirHandle: FileSystemDirectoryHandle): Promise<DiscoveredSubfolder[]> {
  const subfolders: DiscoveredSubfolder[] = []
  try {
    const iterator = typeof (dirHandle as unknown as { values?: () => AsyncIterable<FileSystemHandle> }).values === 'function'
      ? (dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()
      : (dirHandle as unknown as AsyncIterable<FileSystemHandle>)

    for await (const entry of iterator) {
      if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
        const subDirHandle = entry as unknown as FileSystemDirectoryHandle
        const { files, hasObsidianSig, sampleNames } = await analyzeSubdirectory(subDirHandle)
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

export async function analyzeSubdirectory(
  dirHandle: FileSystemDirectoryHandle,
  depth: number = 0,
): Promise<{ files: File[]; hasObsidianSig: boolean; sampleNames: string[] }> {
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
        const sub = await analyzeSubdirectory(entry as unknown as FileSystemDirectoryHandle, depth + 1)
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

export async function readDirectFiles(dirHandle: FileSystemDirectoryHandle): Promise<File[]> {
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

export async function readMarkdownFilesFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
  basePath: string = '',
): Promise<VaultFileItem[]> {
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
        const subFiles = await readMarkdownFilesFromDirectory(entry as unknown as FileSystemDirectoryHandle, relPath)
        results.push(...subFiles)
      }
    }
  } catch {
    // ignore
  }
  return results
}

export function parseObsidianUri(location: string, defaultVaultName = ''): ParsedObsidianUri {
  const raw = location.replace(/^obsidian:\/\/vault\/?/, '').trim()
  if (!raw) return { vaultName: defaultVaultName, subfolderScope: '', fullLocation: location }
  const segments = raw.split('/').filter(Boolean)
  return { vaultName: segments[0] || defaultVaultName, subfolderScope: segments.slice(1).join('/'), fullLocation: location }
}

export function buildObsidianUri(vaultName: string, subfolderScope?: string): string {
  const cleanVault = (vaultName || '').trim()
  const cleanScope = (subfolderScope || '').replace(/^\/+|\/+$/g, '').trim()
  if (!cleanVault) return cleanScope ? `obsidian://open?file=${encodeURIComponent(cleanScope)}` : 'obsidian://open'
  return cleanScope ? `obsidian://vault/${cleanVault}/${cleanScope}` : `obsidian://vault/${cleanVault}`
}

export function openInObsidianApp(vaultNameOrPath = '', filePath = '', content?: string): void {
  const rawTarget = vaultNameOrPath.trim()
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

export function downloadMarkdownFile(fileName: string, content: string): void {
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
