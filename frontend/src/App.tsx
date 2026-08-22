import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WorkspaceProvider } from './shared/context'
import { WorkspaceLayout } from './shared/layouts'


// Lazy-loaded page components for optimal code-splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const DashboardView = lazy(() => import('./features/dashboard/views/DashboardView'))
const AgentsDirectoryView = lazy(() => import('./features/agents/views/AgentsDirectoryView'))
const KnowledgeSourcesView = lazy(() => import('./features/knowledge/views/KnowledgeSourcesView'))
const IntegrationsView = lazy(() => import('./features/integrations/views/IntegrationsView'))
const AutomationView = lazy(() => import('./features/automation/views/AutomationView'))
const SettingsView = lazy(() => import('./features/settings/views/SettingsView'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-xs font-mono text-muted">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>Loading page...</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<HomePage />} />

            {/* AI Agent Workspace Application */}
            <Route element={<WorkspaceLayout />}>
              <Route path="/dashboard" element={<DashboardView />} />
              <Route path="/agents" element={<AgentsDirectoryView />} />
              <Route path="/knowledge" element={<KnowledgeSourcesView />} />
              <Route path="/integrations" element={<IntegrationsView />} />
              <Route path="/automation" element={<AutomationView />} />
              <Route path="/settings" element={<SettingsView />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </WorkspaceProvider>
    </BrowserRouter>
  )
}

export default App
