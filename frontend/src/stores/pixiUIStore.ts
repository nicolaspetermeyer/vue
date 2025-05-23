import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FeatureStats, Position, Projection } from '@/models/data'
import { Colors } from '@/config/Themes'

export const usePixiUIStore = defineStore('pixiUI', () => {
  // Visual state for points
  const hoveredPointId = ref<string | null>(null)
  const selectedPointIds = ref<Set<string>>(new Set())
  const highlightedPointIds = ref<Map<string, number>>(new Map()) // id -> color

  // Visual state for segments
  const hoveredSegmentKey = ref<string | null>(null)
  const segmentOverlays = ref<Map<string, Map<string, { norm: number; color: number }>>>(new Map())

  // Mini-rings state
  const miniRings = ref<
    Map<
      string,
      {
        position: Position
        color: number
        stats: Record<string, { normMean?: number }>
        id: string
      }
    >
  >(new Map())

  // Computed helpers
  const isPointSelected = computed(() => (id: string) => selectedPointIds.value.has(id))
  const isPointHighlighted = computed(() => (id: string) => highlightedPointIds.value.has(id))
  const getPointHighlightColor = computed(
    () => (id: string) => highlightedPointIds.value.get(id) || Colors.NORMAL,
  )

  // Actions
  function setHoveredPoint(id: string | null) {
    hoveredPointId.value = id
  }

  function selectPoints(ids: string[]) {
    selectedPointIds.value = new Set(ids)
  }

  function clearSelection() {
    selectedPointIds.value.clear()
  }

  function highlightPoints(pointColorMap: Record<string, number>) {
    highlightedPointIds.value.clear()
    Object.entries(pointColorMap).forEach(([id, color]) => {
      highlightedPointIds.value.set(id, color)
    })
  }

  function clearHighlightedPoints() {
    highlightedPointIds.value.clear()
  }

  function setHoveredSegment(key: string | null) {
    hoveredSegmentKey.value = key
  }

  function setSegmentOverlay(
    segmentKey: string,
    fingerprintId: string,
    norm: number,
    color: number,
  ) {
    if (!segmentOverlays.value.has(segmentKey)) {
      segmentOverlays.value.set(segmentKey, new Map())
    }
    segmentOverlays.value.get(segmentKey)?.set(fingerprintId, { norm, color })
  }

  function clearSegmentOverlays(segmentKey?: string) {
    if (segmentKey) {
      segmentOverlays.value.delete(segmentKey)
    } else {
      segmentOverlays.value.clear()
    }
  }

  function addMiniRing(
    id: string,
    position: Position,
    color: number,
    stats: Record<string, { normMean?: number }>,
  ) {
    miniRings.value.set(id, { position, color, stats, id })
  }

  function removeMiniRing(id: string) {
    miniRings.value.delete(id)
  }

  function clearMiniRings() {
    miniRings.value.clear()
  }

  return {
    // State
    hoveredPointId,
    selectedPointIds,
    highlightedPointIds,
    hoveredSegmentKey,
    segmentOverlays,
    miniRings,

    // Computed
    isPointSelected,
    isPointHighlighted,
    getPointHighlightColor,

    // Actions
    setHoveredPoint,
    selectPoints,
    clearSelection,
    highlightPoints,
    clearHighlightedPoints,
    setHoveredSegment,
    setSegmentOverlay,
    clearSegmentOverlays,
    addMiniRing,
    removeMiniRing,
    clearMiniRings,
  }
})
