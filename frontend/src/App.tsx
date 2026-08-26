import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WorkspaceProvider } from './shared'
import { WorkspaceLayout } from './shared'

// Lazy-loaded feature views for optimal code-splitting
const HomeView = lazy(() => import('./features/home/views/HomeView'))
const ChatView = lazy(() => import('./features/chat/views/ChatView'))
const AgentsDirectoryView = lazy(() => import('./features/agents/views/AgentsDirectoryView'))
const KnowledgeSourcesView = lazy(() => import('./features/knowledge/views/KnowledgeSourcesView'))
const IntegrationsView = lazy(() => import('./features/integrations/views/IntegrationsView'))
const OAuthCallbackView = lazy(() => import('./features/integrations/views/OAuthCallbackView'))
const AutomationView = lazy(() => import('./features/automation/views/AutomationView'))
const GoalsView = lazy(() => import('./features/goals/views/GoalsView'))
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
            <Route path="/" element={<HomeView />} />

            {/* Standalone OAuth Callback Receiver */}
            <Route path="/oauth/callback" element={<OAuthCallbackView />} />

            {/* AI Agent Workspace Application */}
            <Route element={<WorkspaceLayout />}>
              <Route path="/dashboard" element={<ChatView />} />
              <Route path="/chat" element={<ChatView />} />
              <Route path="/agents" element={<AgentsDirectoryView />} />
              <Route path="/goals" element={<GoalsView />} />
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
