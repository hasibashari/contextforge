import { Terminal, ArrowUpRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-canvas border-t border-hairline pt-16 pb-12 text-ink">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Top 5-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-10 mb-14">
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-3 group">
              <div className="w-6 h-6 rounded bg-ink flex items-center justify-center text-canvas group-hover:bg-primary transition-colors">
                <Terminal size={13} strokeWidth={2.2} />
              </div>
              <span className="text-sm font-semibold tracking-tight text-ink">
                Context<span className="text-primary">Forge</span>
              </span>
            </a>
            <p className="text-xs text-body leading-relaxed mb-4">
              Autonomous AI agent workspace for orchestrating complex codebase and knowledge workflows.
            </p>
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-canvas-soft border border-hairline text-[11px] font-mono text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
              <span>Agents: Ready</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-xs text-ink uppercase tracking-caption mb-3">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-body">
              <li>
                <a href="#hero-sandbox" className="hover:text-ink transition-colors">
                  Agent Workspace
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-ink transition-colors">
                  Autonomous Engine
                </a>
              </li>
              <li>
                <a href="#action-plans" className="hover:text-ink transition-colors">
                  Action Plan Generator
                </a>
              </li>
              <li>
                <a href="#sources" className="hover:text-ink transition-colors">
                  Multi-Source Ingestion
                </a>
              </li>
            </ul>
          </div>

          {/* Connectors */}
          <div>
            <h4 className="font-semibold text-xs text-ink uppercase tracking-caption mb-3">
              Connectors
            </h4>
            <ul className="space-y-2.5 text-xs text-body">
              <li>
                <a href="#sources" className="hover:text-ink transition-colors">
                  GitHub & GitLab
                </a>
              </li>
              <li>
                <a href="#sources" className="hover:text-ink transition-colors">
                  Notion & Confluence
                </a>
              </li>
              <li>
                <a href="#sources" className="hover:text-ink transition-colors">
                  Live Web Scraper
                </a>
              </li>
              <li>
                <a href="#extensibility" className="hover:text-ink transition-colors">
                  MCP Servers
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-xs text-ink uppercase tracking-caption mb-3">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs text-body">
              <li>
                <a href="#extensibility" className="hover:text-ink transition-colors flex items-center gap-1">
                  <span>Documentation</span>
                  <ArrowUpRight size={11} className="text-muted" />
                </a>
              </li>
              <li>
                <a href="#extensibility" className="hover:text-ink transition-colors">
                  Agent SDK
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-ink transition-colors">
                  Security & Privacy
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-ink transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-xs text-ink uppercase tracking-caption mb-3">
              Ecosystem
            </h4>
            <ul className="space-y-2.5 text-xs text-body">
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-ink transition-colors flex items-center gap-1">
                  <span>GitHub Repo</span>
                  <ArrowUpRight size={11} className="text-muted" />
                </a>
              </li>
              <li>
                <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-ink transition-colors flex items-center gap-1">
                  <span>Discord Community</span>
                  <ArrowUpRight size={11} className="text-muted" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-ink transition-colors">
                  Changelog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-ink transition-colors">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Hairline & Legal */}
        <div className="border-t border-hairline pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted">
          <p className="font-mono text-[11px]">
            &copy; {new Date().getFullYear()} ContextForge Inc. Quietly confident AI agents.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="#" className="hover:text-ink transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-ink transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-ink transition-colors">Security Audit</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

