import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ProjectionRow, Point, Projection } from '@/models/data'
import { matchProjection } from '@/utils/matchProjection'
import { useDataStore } from '@/stores/dataStore'
import { useDatasetStore } from '@/stores/datasetStore'
import { fetchProjection } from '@/services/api'

export const useProjectionStore = defineStore('projection', () => {
  const rawProjection = ref<ProjectionRow[]>([])
  const projectionMatch = ref<Projection[]>([])
  const matchedPoints = ref<Point[]>([])
  const projectionInstance = ref<any>(null) // Holds PixiProjection instance
  const selectedPointIds = ref<number[]>([]) // Holds selected point IDs (to be implemented)
  const activeProjectionId = ref('global')

  async function loadProjection() {
    const dataset = useDatasetStore().selectedDatasetName
    const rawData = useDataStore().rawData

    if (!dataset) {
      return null
    }
    try {
      const response: ProjectionRow[] = await fetchProjection(dataset)

      rawProjection.value = response
      projectionMatch.value = matchProjection(rawData, rawProjection.value)
      console.log('Running Dimensionality Reduction')
      console.log('Projection data:', projectionMatch.value)
      mapToPoint(rawProjection.value)
    } catch {
      return null
    }
  }

  function mapToPoint(rows: ProjectionRow[]) {
    matchedPoints.value = rows.map((row, i) => ({
      item_id: i,
      pos: { x: row.x, y: row.y },
    }))
  }

  function setProjectionInstance(instance: any) {
    projectionInstance.value = instance
  }

  function clearProjectionInstance() {
    if (projectionInstance.value) {
      projectionInstance.value.destroy({ children: true })
      projectionInstance.value = null
    }
  }

  function selectPoints(ids: number[]) {
    selectedPointIds.value = ids
  }

  return {
    rawProjection,
    projectionMatch,
    matchedPoints,
    projectionInstance,
    selectedPointIds,
    activeProjectionId,
    loadProjection,
    mapToPoint,
    setProjectionInstance,
    clearProjectionInstance,
    selectPoints,
  }
})
