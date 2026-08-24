import React, { useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react'
import type { WikiGraphData } from '@/shared/types/wiki'

interface WikiGraphViewProps {
  graphData: WikiGraphData
  onSelectNode: (nodeId: string) => void
  activeNodeId?: string | null
}

interface SimNode {
  id: string
  label: string
  category: string
  path: string
  val: number
  group: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface SimLink {
  source: SimNode
  target: SimNode
  value: number
}

// Module-level color mapping per category
const CATEGORY_COLOR: Record<string, string> = {
  index: '#6366f1', // Indigo
  log: '#f59e0b', // Amber
  concept: '#3b82f6', // Primary Blue
  entity: '#10b981', // Emerald
  synthesis: '#a855f7', // Purple
  overview: '#06b6d4', // Cyan
}

export const WikiGraphView: React.FC<WikiGraphViewProps> = ({
  graphData,
  onSelectNode,
  activeNodeId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null)
  const simulationRef = useRef<{
    nodes: SimNode[]
    links: SimLink[]
    animId: number | null
    isDragging: boolean
    draggedNode: SimNode | null
    panOffset: { x: number; y: number }
    isPanning: boolean
    panStart: { x: number; y: number }
  }>({
    nodes: [],
    links: [],
    animId: null,
    isDragging: false,
    draggedNode: null,
    panOffset: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.parentElement?.clientWidth || 800
    const height = canvas.parentElement?.clientHeight || 500
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio

    // Initialize SimNodes
    const nodes: SimNode[] = graphData.nodes.map((n, idx) => {
      const angle = (idx / Math.max(1, graphData.nodes.length)) * 2 * Math.PI
      const radius = 100 + Math.random() * 100
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.max(8, Math.min(22, n.val + 6)),
      }
    })

    const nodeMap = new Map<string, SimNode>()
    nodes.forEach((n) => nodeMap.set(n.id, n))

    const links: SimLink[] = []
    graphData.links.forEach((l) => {
      const src = nodeMap.get(l.source)
      const tgt = nodeMap.get(l.target)
      if (src && tgt) {
        links.push({ source: src, target: tgt, value: l.value })
      }
    })

    const currentSim = simulationRef.current
    currentSim.nodes = nodes
    currentSim.links = links

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const runSimulation = () => {
      // Physics iteration
      const k = 0.05 // spring constant
      const repulsion = 800

      // Node repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i]
          const n2 = nodes[j]
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist < 300) {
            const force = repulsion / (dist * dist)
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            n1.vx -= fx
            n1.vy -= fy
            n2.vx += fx
            n2.vy += fy
          }
        }
      }

      // Link spring attraction
      links.forEach((l) => {
        const dx = l.target.x - l.source.x
        const dy = l.target.y - l.source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 100) * k
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        l.source.vx += fx
        l.source.vy += fy
        l.target.vx -= fx
        l.target.vy -= fy
      })

      // Center gravity & damping
      const cx = width / 2
      const cy = height / 2
      nodes.forEach((n) => {
        n.vx += (cx - n.x) * 0.005
        n.vy += (cy - n.y) * 0.005
        n.vx *= 0.88
        n.vy *= 0.88

        if (n !== currentSim.draggedNode) {
          n.x += n.vx
          n.y += n.vy
        }
      })

      // Render
      ctx.save()
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      ctx.clearRect(0, 0, width, height)

      // Apply Pan & Zoom transform
      ctx.translate(currentSim.panOffset.x, currentSim.panOffset.y)
      ctx.translate(width / 2, height / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-width / 2, -height / 2)

      // Draw Links
      links.forEach((link) => {
        ctx.beginPath()
        ctx.moveTo(link.source.x, link.source.y)
        ctx.lineTo(link.target.x, link.target.y)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      })

      // Draw Nodes
      nodes.forEach((node) => {
        const isSelected = activeNodeId === node.id
        const isHovered = hoveredNode?.id === node.id
        const color = CATEGORY_COLOR[node.category] || '#3b82f6'

        // Glow ring if active/hovered
        if (isSelected || isHovered) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius + 6, 0, 2 * Math.PI)
          ctx.fillStyle = isSelected
            ? 'rgba(59, 130, 246, 0.35)'
            : 'rgba(168, 85, 247, 0.25)'
          ctx.fill()
        }

        // Node Body
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = isSelected ? 2.5 : 1.5
        ctx.stroke()

        // Label text
        ctx.font = isSelected
          ? 'bold 11px Inter, sans-serif'
          : '10px Inter, sans-serif'
        ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(226, 232, 240, 0.85)'
        ctx.textAlign = 'center'
        ctx.fillText(node.label, node.x, node.y + node.radius + 12)
      })

      ctx.restore()

      currentSim.animId = requestAnimationFrame(runSimulation)
    }

    runSimulation()

    return () => {
      if (currentSim.animId) {
        cancelAnimationFrame(currentSim.animId)
      }
    }
  }, [graphData, zoom, hoveredNode, activeNodeId])

  // Mouse interaction handlers (Dragging & Node Clicking)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x =
      (e.clientX - rect.left - simulationRef.current.panOffset.x) / zoom
    const y = (e.clientY - rect.top - simulationRef.current.panOffset.y) / zoom

    const hit = simulationRef.current.nodes.find((n) => {
      const dx = n.x - x
      const dy = n.y - y
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4
    })

    if (hit) {
      simulationRef.current.isDragging = true
      simulationRef.current.draggedNode = hit
      onSelectNode(hit.id)
    } else {
      simulationRef.current.isPanning = true
      simulationRef.current.panStart = { x: e.clientX, y: e.clientY }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x =
      (e.clientX - rect.left - simulationRef.current.panOffset.x) / zoom
    const y = (e.clientY - rect.top - simulationRef.current.panOffset.y) / zoom

    if (simulationRef.current.isDragging && simulationRef.current.draggedNode) {
      simulationRef.current.draggedNode.x = x
      simulationRef.current.draggedNode.y = y
      return
    }

    if (simulationRef.current.isPanning) {
      const dx = e.clientX - simulationRef.current.panStart.x
      const dy = e.clientY - simulationRef.current.panStart.y
      simulationRef.current.panOffset.x += dx
      simulationRef.current.panOffset.y += dy
      simulationRef.current.panStart = { x: e.clientX, y: e.clientY }
      return
    }

    const hit = simulationRef.current.nodes.find((n) => {
      const dx = n.x - x
      const dy = n.y - y
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4
    })

    setHoveredNode(hit || null)
  }

  const handleMouseUp = () => {
    simulationRef.current.isDragging = false
    simulationRef.current.draggedNode = null
    simulationRef.current.isPanning = false
  }

  return (
    <div className="relative w-full h-137.5 bg-canvas-soft/30 rounded-2xl border border-hairline overflow-hidden shadow-inner flex flex-col justify-between">
      {/* Top Legend Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3 bg-canvas-card/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-hairline text-[11px] font-mono shadow-sm">
        <span className="text-muted flex items-center gap-1 font-semibold">
          <Sparkles size={12} className="text-primary" /> Graph Clusters:
        </span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
          <span>Index</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
          <span>Concepts</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span>Entities</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
          <span>Synthesis</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <span>Logs</span>
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-canvas-card/90 backdrop-blur-md p-1.5 rounded-xl border border-hairline shadow-md">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={() => {
            setZoom(1)
            simulationRef.current.panOffset = { x: 0, y: 0 }
          }}
          className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink transition-colors"
          title="Reset View"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Interactive HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  )
}
