// Layouts & Shell
export { default as HomeLayout } from './layouts/HomeLayout'
export { default as DashboardLayout } from './layouts/DashboardLayout'
export { default as WorkspaceLayout } from './layouts/WorkspaceLayout'
export { default as WorkspaceSidebar } from './layouts/shell/WorkspaceSidebar'
export { default as WorkspaceHeader } from './layouts/shell/WorkspaceHeader'
export { default as WorkspaceContextAside } from './layouts/shell/WorkspaceContextAside'

// Context & State
export { WorkspaceProvider } from './context/WorkspaceContext'
export { WorkspaceContext } from './context/context'
export { useWorkspace } from './context/useWorkspace'
export type { WorkspaceContextType } from './context/context'

// Global Components & Design System
export * from './components/Navbar'
export * from './components/Footer'
export * from './components/EcosystemCard'
export * from './components/MarkdownRenderer'
export * from './components/GlobalToast'
export * from './components/PageHeader'

// UI Primitives & Molecules
export * from './components/ui/Modal'
export * from './components/ui/StatusPill'
export * from './components/ui/IconBox'
export * from './components/ui/ConfirmDeleteModal'
export * from './components/ui/EmptyState'
export * from './components/ui/Button'
export * from './components/ui/Input'
export * from './components/ui/Textarea'
export * from './components/ui/Select'
export * from './components/ui/FormField'
export * from './components/ui/Badge'
export * from './components/ui/SegmentedTabs'
export * from './components/ui/Card'
export * from './components/ui/QrCodeBox'
