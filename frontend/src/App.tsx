import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import { WorkspaceProvider } from './shared/mock/WorkspaceContext'
import { WorkspaceLayout } from './shared/layouts'
import { DashboardView } from './features/dashboard'
import { TasksListView, TaskDetailView } from './features/tasks'
import { AgentsDirectoryView } from './features/agents'
import { KnowledgeSourcesView } from './features/knowledge'
import { IntegrationsView } from './features/integrations'
import { ActivityView } from './features/activity'
import { SettingsView } from './features/settings'

function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<HomePage />} />

          {/* AI Agent Workspace Application */}
          <Route element={<WorkspaceLayout />}>
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/tasks" element={<TasksListView />} />
            <Route path="/tasks/:taskId" element={<TaskDetailView />} />
            <Route path="/agents" element={<AgentsDirectoryView />} />
            <Route path="/knowledge" element={<KnowledgeSourcesView />} />
            <Route path="/integrations" element={<IntegrationsView />} />
            <Route path="/activity" element={<ActivityView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WorkspaceProvider>
    </BrowserRouter>
  )
}

export default App
