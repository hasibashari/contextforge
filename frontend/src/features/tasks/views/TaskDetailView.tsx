import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Brain,
  Database,
} from 'lucide-react'
import { useWorkspace } from '../../../shared/mock'
import { TaskTimelineStepper } from '../components/TaskTimelineStepper'
import { ToolCallInspector } from '../components/ToolCallInspector'
import { TerminalLogViewer } from '../components/TerminalLogViewer'
import { CodeDiffViewer } from '../components/CodeDiffViewer'
import { HumanApprovalGate } from '../components/HumanApprovalGate'

export default function TaskDetailView() {
  const { taskId } = useParams<{ taskId: string }>()
  const {
    tasks,
    agents,
    knowledgeSources,
    approveTask,
    rejectTask,
    advanceTaskStage,
    simulateLiveRun,
    activeRunningTaskId,
  } = useWorkspace()

  const task = useMemo(() => {
    return tasks.find((t) => t.id === taskId) || tasks[0]
  }, [tasks, taskId])

  const agent = useMemo(() => {
    return agents.find((a) => a.id === task?.agentId) || agents[0]
  }, [agents, task])

  // Extract all logs and tool calls across all execution steps unconditionally
  const allLogs = useMemo(() => {
    return task?.steps.flatMap((s) => s.logs) || []
  }, [task])

  const allToolCalls = useMemo(() => {
    return task?.steps.flatMap((s) => s.toolCalls || []) || []
  }, [task])

  if (!task) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold text-ink">Task not found</h2>
        <Link to="/tasks" className="text-primary text-xs underline font-mono">
          Return to Tasks List
        </Link>
      </div>
    )
  }

  const isSimulating = activeRunningTaskId === task.id

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1 hover:text-ink transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            <span>Tasks</span>
          </Link>
          <span>/</span>
          <span className="font-mono font-semibold text-ink">{task.id}</span>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => advanceTaskStage(task.id)}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg bg-surface-card border border-hairline hover:border-hairline-strong text-ink text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
          >
            Advance Phase &rarr;
          </button>

          <button
            onClick={() => simulateLiveRun(task.id)}
            disabled={isSimulating}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-active text-on-primary text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Play size={13} className={isSimulating ? 'animate-spin' : ''} />
            <span>{isSimulating ? 'Executing Run...' : 'Simulate Live Run'}</span>
          </button>
        </div>
      </div>

      {/* Task Header Card */}
      <div className="bg-surface-card border border-hairline rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono font-bold text-xs text-primary">{task.id}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-strong text-muted">
                {task.repo}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-body">
                <Brain size={13} className="text-primary" />
                <span className="font-medium">{agent.name}</span>
                <span className="text-muted font-mono text-[10px]">({agent.model})</span>
              </div>
            </div>

            <h1 className="text-lg sm:text-2xl font-bold text-ink tracking-tight">
              {task.title}
            </h1>
          </div>

          {/* Telemetry Metrics */}
          {task.tokensUsed && (
            <div className="flex items-center gap-3 bg-canvas-soft border border-hairline px-3.5 py-2 rounded-lg text-xs font-mono shrink-0">
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted uppercase">Token Consumption</div>
                <div className="font-semibold text-ink">{task.tokensUsed.total.toLocaleString()} tokens</div>
              </div>
              <div className="w-px h-6 bg-hairline" />
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted uppercase">Est. Cost</div>
                <div className="font-semibold text-semantic-success">${task.tokensUsed.estimatedCostUsd.toFixed(3)}</div>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-body leading-relaxed max-w-4xl">
          {task.objective}
        </p>

        {/* Grounding Knowledge Tags */}
        <div className="pt-3 border-t border-hairline flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted text-[11px] font-mono uppercase tracking-caption">
            Grounding Sources:
          </span>
          {task.knowledgeSources.map((ksId) => {
            const ks = knowledgeSources.find((k) => k.id === ksId)
            return (
              <span
                key={ksId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-canvas border border-hairline text-ink text-xs font-mono"
              >
                <Database size={12} className="text-primary" />
                <span>{ks?.name || ksId}</span>
              </span>
            )
          })}
        </div>
      </div>

      {/* Stepper Timeline Navigation */}
      <TaskTimelineStepper
        currentStage={task.currentStage}
        onAdvanceStage={() => advanceTaskStage(task.id)}
        isSimulating={isSimulating}
      />

      {/* Main Dual-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Execution Stream, Tool Payloads, & Terminal Logs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Terminal Log Stream */}
          <TerminalLogViewer
            logs={allLogs}
            agentName={agent.name}
            isRunning={isSimulating || task.status === 'running_tools' || task.status === 'planning'}
          />

          {/* Tool Calls Inspector */}
          <ToolCallInspector toolCalls={allToolCalls} />
        </div>

        {/* Right Column (5 cols): Human Approval Gate & Code Diffs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Human-in-the-Loop Sign-off */}
          <HumanApprovalGate
            deliverable={task.deliverable}
            status={task.status}
            onApprove={() => approveTask(task.id)}
            onReject={() => rejectTask(task.id)}
          />

          {/* Code Diff File Inspector */}
          {task.deliverable?.diffs && (
            <CodeDiffViewer
              diffs={task.deliverable.diffs}
              branchName={task.deliverable.branchName}
            />
          )}
        </div>
      </div>
    </div>
  )
}
