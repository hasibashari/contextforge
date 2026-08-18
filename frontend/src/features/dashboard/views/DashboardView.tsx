import { useState } from 'react'
import { DashboardLayout } from '../../../shared/layouts'
import DashboardSidebar from '../components/DashboardSidebar'
import type { DashboardTab } from '../components/DashboardSidebar'
import DashboardHeader from '../components/DashboardHeader'
import DashboardOverview from '../components/DashboardOverview'
import DashboardContextAside from '../components/DashboardContextAside'
import NewTaskModal from '../components/NewTaskModal'

export default function DashboardView() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [isAsideOpen, setIsAsideOpen] = useState(true)

  return (
    <>
      <DashboardLayout
        sidebar={
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        }
        header={
          <DashboardHeader
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onNewTaskClick={() => setIsNewTaskModalOpen(true)}
            isAsideOpen={isAsideOpen}
            onToggleAside={() => setIsAsideOpen(!isAsideOpen)}
          />
        }
        aside={<DashboardContextAside />}
        isAsideOpen={isAsideOpen}
      >
        <DashboardOverview
          activeTab={activeTab}
          onNewTaskClick={() => setIsNewTaskModalOpen(true)}
        />
      </DashboardLayout>

      {/* Global Dispatch Agent Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </>
  )
}
