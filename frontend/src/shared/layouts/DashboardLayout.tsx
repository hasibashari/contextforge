import React from 'react'

interface DashboardLayoutProps {
  sidebar: React.ReactNode
  header: React.ReactNode
  children: React.ReactNode
  aside?: React.ReactNode
  isAsideOpen?: boolean
}

export default function DashboardLayout({
  sidebar,
  header,
  children,
  aside,
  isAsideOpen = true,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas flex text-ink overflow-hidden">
      {/* Area 1: Left Primary Navigation Sidebar */}
      {sidebar}

      {/* Main Container: Header + Workspace + Right Aside */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        {header}

        {/* Workspace Body: Main Content + Right Contextual Aside */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Area 2: Primary Workspace (Scrollable) */}
          <main className="flex-1 overflow-y-auto min-w-0">
            {children}
          </main>

          {/* Area 3: Right Contextual Inspector Aside (Collapsible) */}
          {aside && (
            <aside
              className={`border-l border-hairline bg-canvas-soft transition-all duration-200 ease-in-out flex flex-col shrink-0 overflow-y-auto ${
                isAsideOpen
                  ? 'w-72 lg:w-80 translate-x-0'
                  : 'w-0 -translate-x-full border-l-0 opacity-0 overflow-hidden pointer-events-none'
              }`}
            >
              <div className="w-72 lg:w-80">
                {aside}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
