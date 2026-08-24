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

export interface VaultFileInfo {
  path: string
  name: string
  extension: string
  size: number
  lastModified: number
}

export interface FileMatchResult {
  path: string
  matchType: 'title' | 'content'
  snippet?: string
}

export interface BacklinkResult {
  notePath: string
  lineSnippet: string
}
