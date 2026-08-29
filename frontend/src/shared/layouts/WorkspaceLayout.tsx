import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardLayout from '@/shared/layouts/DashboardLayout'
import WorkspaceSidebar from '@/shared/layouts/shell/WorkspaceSidebar'
import WorkspaceHeader from '@/shared/layouts/shell/WorkspaceHeader'

export default function WorkspaceLayout() {
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
        />
      }
    >
      <Outlet />
    </DashboardLayout>
  )
}
