import React, { useState, useEffect, useRef } from 'react'

const DEFAULT_ASIDE_WIDTH = 380
const MIN_ASIDE_WIDTH = 300
const MAX_ASIDE_WIDTH_PERCENT = 0.65

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
  // Load saved width from localStorage or fallback to default
  const [asideWidth, setAsideWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('contextforge_aside_width')
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (parsed >= MIN_ASIDE_WIDTH && parsed <= 900) return parsed
      }
    } catch {
      // ignore
    }
    return DEFAULT_ASIDE_WIDTH
  })

  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)

  // Start drag handler
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    isDraggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // Double-click to reset width
  const handleDoubleClick = () => {
    setAsideWidth(DEFAULT_ASIDE_WIDTH)
    try {
      localStorage.setItem('contextforge_aside_width', DEFAULT_ASIDE_WIDTH.toString())
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return

      const maxAllowed = Math.min(window.innerWidth * MAX_ASIDE_WIDTH_PERCENT, 900)
      const newWidth = Math.max(MIN_ASIDE_WIDTH, Math.min(window.innerWidth - e.clientX, maxAllowed))

      setAsideWidth(newWidth)
    }

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''

        // Persist
        setAsideWidth((current) => {
          try {
            localStorage.setItem('contextforge_aside_width', current.toString())
          } catch {
            // ignore
          }
          return current
        })
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  return (
    <div className="h-dvh w-full bg-canvas flex text-ink overflow-hidden">
      {/* Area 1: Left Primary Navigation Sidebar */}
      {sidebar}

      {/* Main Container: Header + Workspace + Right Aside */}
      <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 overflow-hidden">
        {/* Top Header Bar */}
        {header}

        {/* Workspace Body: Main Content + Right Contextual Aside */}
        <div className="flex-1 flex min-h-0 h-full overflow-hidden relative">
          {/* Area 2: Primary Workspace */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-y-auto overscroll-contain relative">
            {children}
          </main>

          {/* Area 3: Right Contextual Inspector Aside (Resizable & Collapsible) */}
          {aside && (
            <aside
              style={{
                width: isAsideOpen ? `${asideWidth}px` : '0px',
              }}
              className={`relative bg-canvas-soft flex flex-col shrink-0 h-full overflow-hidden ${
                isDragging
                  ? 'select-none transition-none'
                  : 'transition-[width,transform,opacity] duration-200 ease-in-out'
              } ${
                isAsideOpen
                  ? 'border-l border-hairline translate-x-0 opacity-100'
                  : 'border-l-0 -translate-x-full opacity-0 pointer-events-none'
              }`}
            >
              {/* Resize Drag Gutter Handle (Left Edge) */}
              {isAsideOpen && (
                <div
                  onPointerDown={handlePointerDown}
                  onDoubleClick={handleDoubleClick}
                  className={`absolute left-0 top-0 bottom-0 w-2.5 -translate-x-1.5 z-30 cursor-col-resize select-none touch-none group flex items-center justify-center transition-colors ${
                    isDragging ? 'bg-primary/20' : 'hover:bg-primary/20'
                  }`}
                  title="Drag to resize · Double-click to reset"
                >
                  <div
                    className={`w-1 h-8 rounded-full transition-all ${
                      isDragging
                        ? 'bg-primary opacity-100 scale-y-125'
                        : 'bg-muted/40 group-hover:bg-primary group-hover:opacity-100'
                    }`}
                  />
                </div>
              )}

              {/* Aside Content Container */}
              <div
                style={{ width: `${asideWidth}px` }}
                className="h-full flex flex-col min-h-0 overflow-hidden"
              >
                {aside}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
