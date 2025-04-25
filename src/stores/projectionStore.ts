import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ProjectionRow, Point, Projection } from '@/models/data'
import { matchProjection } from '@/utils/matchProjection'
import { useDataStore } from '@/stores/dataStore'
import { useDatasetStore } from '@/stores/datasetStore'
import { fetchProjection, fetchProjectionbyMethod } from '@/services/api'
import { PixiProjection } from '@/pixi/PixiProjection'

export const useProjectionStore = defineStore('projection', () => {
  const rawProjection = ref<ProjectionRow[]>([])
  const projectionMatch = ref<Projection[]>([])
  const matchedPoints = ref<Point[]>([])
  const projectionInstance = ref<PixiProjection | null>(null) // Holds PixiProjection instance
  const projectionMethod = ref<'pca' | 'tsne'>('pca')

  async function loadProjection() {
    const dataset = useDatasetStore().selectedDatasetName
    const rawData = useDataStore().rawData

    if (!dataset) {
      return null
    }
    try {
      rawProjection.value = await fetchProjectionbyMethod(dataset, projectionMethod.value)
      console.log('rawProjection', rawProjection.value)

      projectionMatch.value = matchProjection(rawData, rawProjection.value)

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

  function setProjectionInstance(instance: PixiProjection) {
    projectionInstance.value = instance
  }

  function clearProjectionInstance() {
    if (projectionInstance.value) {
      projectionInstance.value = null
    }
  }

  return {
    rawProjection,
    projectionMatch,
    matchedPoints,
    projectionInstance,
    projectionMethod,
    loadProjection,
    mapToPoint,
    setProjectionInstance,
    clearProjectionInstance,
  }
})
