import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ProjectionRow, Point } from '@/models/data'

export const useProjectionStore = defineStore('projection', () => {
  const rawProjection = ref<ProjectionRow[]>([])
  const matchedPoints = ref<Point[]>([])
  const selectedPointIds = ref<number[]>([])
  const activeProjectionId = ref('global')

  function setProjection(rows: ProjectionRow[]) {
    rawProjection.value = rows
    matchedPoints.value = rows.map((row, i) => ({
      item_id: i,
      pos: { x: row.x, y: row.y },
    }))
  }

  function selectPoints(ids: number[]) {
    selectedPointIds.value = ids
  }

  return {
    rawProjection,
    matchedPoints,
    selectedPointIds,
    activeProjectionId,
    setProjection,
    selectPoints,
  }
})
