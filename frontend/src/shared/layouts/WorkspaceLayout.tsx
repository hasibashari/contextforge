import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardLayout from '@/shared/layouts/DashboardLayout'
import WorkspaceSidebar from '@/shared/layouts/shell/WorkspaceSidebar'
import WorkspaceHeader from '@/shared/layouts/shell/WorkspaceHeader'
import WorkspaceContextAside from '@/shared/layouts/shell/WorkspaceContextAside'
import { useWorkspace } from '@/shared'

export default function WorkspaceLayout() {
  const { isAsideOpen, toggleAside } = useWorkspace()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <DashboardLayout
      sidebar={
        <WorkspaceSidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      }
      header={
        <WorkspaceHeader
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          isAsideOpen={isAsideOpen}
          onToggleAside={toggleAside}
        />
      }
      aside={<WorkspaceContextAside />}
      isAsideOpen={isAsideOpen}
    >
      <Outlet />
    </DashboardLayout>
  )
}
