import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import DashboardLayout from './DashboardLayout'
import DashboardSidebar from '../../features/dashboard/components/DashboardSidebar'
import DashboardHeader from '../../features/dashboard/components/DashboardHeader'
import DashboardContextAside from '../../features/dashboard/components/DashboardContextAside'
import NewTaskModal from '../../features/dashboard/components/NewTaskModal'
import { useWorkspace } from '../mock'

export default function WorkspaceLayout() {
  const { toastMessage } = useWorkspace()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [isAsideOpen, setIsAsideOpen] = useState(true)

  return (
    <>
      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-6 z-50 bg-ink text-canvas px-4 py-3 rounded-xl shadow-xl border border-hairline flex items-center gap-2.5 text-xs font-medium max-w-md"
          >
            <CheckCircle2 size={16} className="text-semantic-success shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            onNewTaskClick={() => setIsNewTaskModalOpen(true)}
            isAsideOpen={isAsideOpen}
            onToggleAside={() => setIsAsideOpen(!isAsideOpen)}
          />
        }
        aside={<DashboardContextAside />}
        isAsideOpen={isAsideOpen}
      >
        <Outlet />
      </DashboardLayout>

      {/* Global Dispatch Agent Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </>
  )
}
