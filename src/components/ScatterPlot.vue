<template>
  <div ref="containerRef" class="canvas-container">
    <canvas ref="canvasRef" @mousemove="onMouseMove" @mouseleave="onMouseLeave" />
    <div v-if="isLoading" class="overlay">
      <p>Loading scatterplot...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import type { ProjectedPoint } from '@/models/data' // if needed

const props = defineProps<{
  points: { id: string; x: number; y: number }[]
}>()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const hoveredId = ref<string | null>(null)
let resizeObserver: ResizeObserver

function draw(points: typeof props.points) {
  console.log('🔍 Drawing', points.length, 'points')

  const canvas = canvasRef.value
  if (!canvas || points.length === 0) return
  console.log('points: ', points)
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas

  // Scales
  const xExtent = d3.extent(points, (d) => d.x) as [number, number]
  const yExtent = d3.extent(points, (d) => d.y) as [number, number]

  const padding = 40
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2

  const xScale = d3
    .scaleLinear()
    .domain(xExtent)
    .range([padding, padding + plotWidth])
  const yScale = d3
    .scaleLinear()
    .domain(yExtent)
    .range([padding + plotHeight, padding]) // flip y

  ctx.clearRect(0, 0, width, height)
  for (const point of points) {
    const cx = xScale(point.x)
    const cy = yScale(point.y)

    const isHovered = point.id === hoveredId.value
    ctx.beginPath()
    ctx.arc(cx, cy, isHovered ? 6 : 4, 0, 2 * Math.PI)
    ctx.fillStyle = isHovered ? '#e63946' : '#333'
    ctx.fill()
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const { width, height } = container.getBoundingClientRect()
  if (width === 0 || height === 0) return
  canvas.width = width
  canvas.height = height

  draw(props.points)
}

// Cursor movement handler
function onMouseMove(event: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const found = findNearestPoint(mouseX, mouseY)
  hoveredId.value = found?.id ?? null
  draw(props.points)
}

// Clear hover when leaving canvas
function onMouseLeave() {
  hoveredId.value = null
  draw(props.points)
}

// Find the nearest point to the mouse (within radius threshold)
function findNearestPoint(mouseX: number, mouseY: number): { id: string } | null {
  const canvas = canvasRef.value
  if (!canvas || props.points.length === 0) return null

  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas

  const padding = 40
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2

  const xExtent = d3.extent(props.points, (d) => d.x) as [number, number]
  const yExtent = d3.extent(props.points, (d) => d.y) as [number, number]

  const xScale = d3
    .scaleLinear()
    .domain(xExtent)
    .range([padding, padding + plotWidth])
  const yScale = d3
    .scaleLinear()
    .domain(yExtent)
    .range([padding + plotHeight, padding])

  const hitRadius = 6

  for (const p of props.points) {
    const cx = xScale(p.x)
    const cy = yScale(p.y)
    const dx = mouseX - cx
    const dy = mouseY - cy
    if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
      return { id: p.id }
    }
  }
  return null
}

onMounted(() => {
  resizeObserver = new ResizeObserver(resizeCanvas)
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  resizeCanvas()
})

watch(
  () => props.points,
  () => {
    resizeCanvas()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
})
</script>
