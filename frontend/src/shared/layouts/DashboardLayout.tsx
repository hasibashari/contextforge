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
    <div className="h-dvh w-full bg-canvas flex text-ink overflow-hidden">
      {/* Area 1: Left Primary Navigation Sidebar */}
      {sidebar}

      {/* Main Container: Header + Workspace + Right Aside */}
      <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 overflow-hidden">
        {/* Top Header Bar */}
        {header}

        {/* Workspace Body: Main Content + Right Contextual Aside */}
        <div className="flex-1 flex min-h-0 h-full overflow-hidden">
          {/* Area 2: Primary Workspace */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-y-auto overscroll-contain relative">
            {children}
          </main>

          {/* Area 3: Right Contextual Inspector Aside (Collapsible) */}
          {aside && (
            <aside
              className={`border-l border-hairline bg-canvas-soft transition-[width,transform,opacity] duration-200 ease-in-out flex flex-col shrink-0 h-full overflow-hidden ${
                isAsideOpen
                  ? 'w-72 lg:w-80 translate-x-0'
                  : 'w-0 -translate-x-full border-l-0 opacity-0 overflow-hidden pointer-events-none'
              }`}
            >
              <div className="w-72 lg:w-80 h-full flex flex-col min-h-0 overflow-hidden">
                {aside}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
