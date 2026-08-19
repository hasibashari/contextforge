import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardLayout from '@/shared/layouts/DashboardLayout'
import DashboardSidebar from '@/features/dashboard/components/DashboardSidebar'
import DashboardHeader from '@/features/dashboard/components/DashboardHeader'
import DashboardContextAside from '@/features/dashboard/components/DashboardContextAside'
// import { GlobalToast } from '@/shared/components'
import { useWorkspace } from '@/shared/mock'

export default function WorkspaceLayout() {
  const { isAsideOpen, toggleAside } = useWorkspace()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Global Toast System (Disabled temporarily, component preserved in GlobalToast.tsx) */}
      {/* <GlobalToast toasts={toasts} onDismiss={dismissToast} /> */}

      <DashboardLayout
        sidebar={
          <DashboardSidebar
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        }
        header={
          <DashboardHeader
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            isAsideOpen={isAsideOpen}
            onToggleAside={toggleAside}
          />
        }
        aside={<DashboardContextAside />}
        isAsideOpen={isAsideOpen}
      >
        <Outlet />
      </DashboardLayout>
    </>
  )
}
