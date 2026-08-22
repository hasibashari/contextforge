import { useContext } from 'react'
import { WorkspaceContext, type WorkspaceContextType } from './context'

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
