import { useState, useEffect } from 'react'
import { Menu, X, Terminal, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  )
}


export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200 h-16 flex items-center',
        isScrolled
          ? 'bg-canvas/90 backdrop-blur-md border-b border-hairline'
          : 'bg-canvas border-b border-transparent'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center text-canvas group-hover:bg-primary transition-colors">
            <Terminal size={15} strokeWidth={2.2} />
          </div>
          <span className="text-base font-semibold tracking-tight text-ink">
            Context<span className="text-primary">Forge</span>
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-strong text-muted text-nowrap hidden sm:inline-block">
            v0.9-agent
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7">
          <a
            href="#sources"
            className="text-sm font-medium text-body hover:text-ink transition-colors"
          >
            Context Sources
          </a>
          <a
            href="#workflow"
            className="text-sm font-medium text-body hover:text-ink transition-colors"
          >
            Agent Engine
          </a>
          <a
            href="#action-plans"
            className="text-sm font-medium text-body hover:text-ink transition-colors"
          >
            Action Plans
          </a>
          <a
            href="#extensibility"
            className="text-sm font-medium text-body hover:text-ink transition-colors"
          >
            MCP & Tools
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-body hover:text-ink transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-body hover:text-ink px-3 py-1.5 rounded-xl hover:bg-canvas-soft border border-transparent hover:border-hairline transition-all"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs"
          >
            <span>Launch Workspace</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-ink p-1.5 rounded-xl hover:bg-canvas-soft border border-hairline transition-colors cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-canvas border-b border-hairline py-4 px-6 flex flex-col gap-3 md:hidden shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
          <a
            href="#sources"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-medium text-ink py-1.5 border-b border-hairline-soft"
          >
            Context Sources
          </a>
          <a
            href="#workflow"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-medium text-ink py-1.5 border-b border-hairline-soft"
          >
            Agent Engine
          </a>
          <a
            href="#action-plans"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-medium text-ink py-1.5 border-b border-hairline-soft"
          >
            Action Plans
          </a>
          <a
            href="#extensibility"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-medium text-ink py-1.5 border-b border-hairline-soft"
          >
            MCP & Tools
          </a>
          <a
            href="#faq"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-medium text-ink py-1.5 border-b border-hairline-soft"
          >
            FAQ
          </a>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-primary hover:bg-primary-active text-on-primary text-center py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Launch Workspace</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

