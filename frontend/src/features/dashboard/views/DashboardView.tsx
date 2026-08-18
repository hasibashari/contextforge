import React, { useState } from 'react'
import DashboardOverview from '../components/DashboardOverview'
import NewTaskModal from '../components/NewTaskModal'

export default function DashboardView() {
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)

  return (
    <>
      <DashboardOverview onNewTaskClick={() => setIsNewTaskModalOpen(true)} />
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </>
  )
}
