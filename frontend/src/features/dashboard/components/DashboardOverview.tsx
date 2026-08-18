import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Brain,
  FileCheck,
  GitPullRequest,
  Terminal,
  Database,
  Sparkles,
  ShieldCheck,
  Play,
  Send,
  Plus,
} from 'lucide-react'
import { useWorkspace } from '../../../shared/mock'

interface DashboardOverviewProps {
  onNewTaskClick?: () => void
}

export default function DashboardOverview({ onNewTaskClick }: DashboardOverviewProps) {
  const navigate = useNavigate()
  const {
    tasks,
    agents,
    knowledgeSources,
    approveTask,
    createTask,
    simulateLiveRun,
    activeRunningTaskId,
  } = useWorkspace()

  const [inlinePrompt, setInlinePrompt] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || 'agent-sec-docs')

  const pendingTasks = tasks.filter((t) => t.status === 'waiting_approval')
  const inFlightTasks = tasks.filter(
    (t) => t.status === 'running_tools' || t.status === 'planning' || t.status === 'analyzing'
  )
  const activeTask = inFlightTasks[0] || tasks[0]

  const handleInlineDispatch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inlinePrompt.trim()) return

    const newTask = createTask({
      title: inlinePrompt.slice(0, 50),
      objective: inlinePrompt,
      agentId: selectedAgentId,
      selectedSources: ['source-github-core', 'source-notion-sops'],
    })

    setInlinePrompt('')
    navigate(`/tasks/${newTask.id}`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Task Command Dispatcher */}
      <div className="bg-surface-card border border-hairline rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
              <Sparkles size={13} />
              <span>AI Agent Command Center</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Delegate Autonomous Engineering Workflows
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted hidden sm:inline">
              Cluster: <strong className="text-ink">acme-platform</strong>
            </span>
            {onNewTaskClick && (
              <button
                onClick={onNewTaskClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus size={13} />
                <span>Custom Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Prompt Input */}
        <form onSubmit={handleInlineDispatch} className="space-y-3">
          <div className="relative">
            <textarea
              rows={2}
              value={inlinePrompt}
              onChange={(e) => setInlinePrompt(e.target.value)}
              placeholder="Describe a goal for your agent... e.g. Ingest Notion Security RFC #204, audit authMiddleware.ts, and run sandboxed AST regression suite."
              className="w-full p-4 pr-24 bg-canvas-soft border border-hairline rounded-xl text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:bg-surface-card transition-colors resize-none leading-relaxed"
            />
            <button
              type="submit"
              disabled={!inlinePrompt.trim()}
              className="absolute right-3 bottom-3 px-4 py-2 bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Dispatch</span>
              <Send size={13} />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted text-[11px] font-mono uppercase tracking-caption">
                Target Agent:
              </span>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="px-2.5 py-1 rounded-md bg-canvas-soft border border-hairline text-ink font-mono text-xs focus:outline-none focus:border-primary"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-muted text-[11px] font-mono">
              <ShieldCheck size={13} className="text-semantic-success" />
              <span>Strict Human-in-the-Loop Sign-off Active</span>
            </div>
          </div>
        </form>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-hairline p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Active Agents</span>
            <Brain size={16} className="text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-ink font-mono">
            {agents.filter((a) => a.status === 'executing').length}
          </div>
          <div className="text-[11px] text-body mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
            <span>{agents.length} specialized agents configured</span>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Knowledge Sources</span>
            <Database size={16} className="text-timeline-read" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-ink font-mono">
            {knowledgeSources.length}
          </div>
          <div className="text-[11px] text-body mt-1">GitHub, Notion, Web API, MCP</div>
        </div>

        <div className="bg-surface-card border border-hairline p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Pending Human Reviews</span>
            <FileCheck size={16} className="text-timeline-thinking" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-ink font-mono">
            {pendingTasks.length}
          </div>
          <div className="text-[11px] text-primary mt-1 font-medium">
            Awaiting engineer approval
          </div>
        </div>

        <div className="bg-surface-card border border-hairline p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">AST Safety Checks</span>
            <ShieldCheck size={16} className="text-semantic-success" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-ink font-mono">100%</div>
          <div className="text-[11px] text-semantic-success mt-1">0 regressions detected</div>
        </div>
      </div>

      {/* Main Split Grid: Live In-Flight Stream Preview & Pending Action Plans Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Agent Task Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-ink">In-Flight Agent Execution Stream</h2>
            </div>
            <Link
              to={`/tasks/${activeTask.id}`}
              className="text-xs text-primary hover:underline font-mono inline-flex items-center gap-1"
            >
              <span>Full Timeline &rarr;</span>
            </Link>
          </div>

          <div className="bg-surface-card rounded-xl border border-hairline overflow-hidden shadow-xs">
            {/* Terminal Header */}
            <div className="px-4 py-3 bg-canvas-soft border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef6a5b]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#f4be4f]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#61c554]" />
                <span className="text-xs font-mono text-ink font-semibold ml-2">
                  {activeTask.id}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-semantic-success">
                <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse" />
                <span>Active</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 bg-ink text-canvas font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
              <div className="text-muted-soft text-[11px]">
                &gt; Task: {activeTask.title}
              </div>
              {activeTask.steps.flatMap((s) => s.logs).map((log, idx) => (
                <div key={idx} className="leading-relaxed text-hairline-soft">
                  {log}
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="p-3 bg-canvas-soft border-t border-hairline flex items-center justify-between text-xs">
              <span className="text-muted font-mono text-[11px]">
                Stage: <strong className="text-ink uppercase">{activeTask.currentStage}</strong>
              </span>
              <button
                onClick={() => simulateLiveRun(activeTask.id)}
                disabled={activeRunningTaskId === activeTask.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-card border border-hairline hover:border-hairline-strong text-ink font-mono text-[11px] transition-colors cursor-pointer"
              >
                <Play size={12} />
                <span>Simulate Step</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pending Action Plans for Human Review (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-timeline-thinking" />
              <h2 className="text-sm font-semibold text-ink">Action Plans for Review</h2>
            </div>
            <Link to="/tasks" className="text-xs text-muted hover:text-ink font-mono">
              View All ({tasks.length})
            </Link>
          </div>

          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="p-6 bg-surface-card border border-hairline rounded-xl text-center text-xs text-muted">
                All action plans have been signed off!
              </div>
            ) : (
              pendingTasks.slice(0, 3).map((task) => {
                return (
                  <div
                    key={task.id}
                    className="bg-surface-card border border-hairline-strong rounded-xl p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-primary">
                          {task.id}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                          Pending Sign-off
                        </span>
                      </div>
                      <span className="text-[11px] text-muted font-mono">{task.createdAt}</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-medium text-ink leading-snug">
                      {task.title}
                    </h3>

                    <div className="flex items-center justify-between pt-2 border-t border-hairline text-xs">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="text-body hover:text-ink font-medium text-xs underline"
                      >
                        Inspect Diff & Stream &rarr;
                      </Link>

                      <button
                        onClick={() => approveTask(task.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-active text-on-primary text-xs font-medium transition-colors cursor-pointer"
                      >
                        <GitPullRequest size={13} />
                        <span>Approve & PR</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Connected Context Sources Glance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-ink">Connected Grounding Sources</h2>
          </div>
          <Link to="/knowledge" className="text-xs text-muted hover:text-ink font-mono">
            Manage Sources &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {knowledgeSources.map((src) => {
            return (
              <div
                key={src.id}
                className="bg-surface-card border border-hairline p-4 rounded-xl flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-caption text-muted">
                      {src.type.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-semantic-success font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                      Synced
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-ink truncate mb-1">
                    {src.name}
                  </div>
                  <p className="text-[11px] text-body line-clamp-1">{src.meta}</p>
                </div>

                <div className="pt-2 border-t border-hairline-soft flex items-center justify-between text-[11px] text-muted font-mono">
                  <span>{src.chunksCount} chunks</span>
                  <span className="text-primary hover:underline">Grounding Ready</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
