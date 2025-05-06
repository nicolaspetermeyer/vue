import type { Data, ProjectionRow, Projection, FeatureStats } from '@/models/data'

export function matchProjection(rawData: Data[], projection: ProjectionRow[]): Projection[] {
  const rawMap = new Map<number, Data>()

  for (const d of rawData) {
    rawMap.set(d.id, d)
  }

  return projection
    .map(({ id, x, y }) => {
      const numericId = Number(id)
      const original = rawMap.get(numericId)
      if (!original) {
        console.warn(`⚠️ No rawData match for projected point ID: ${id}`)
        return null
      }

      return {
        id: numericId,
        pos: { x, y },
        original,
      } as Projection
    })
    .filter((p): p is Projection => p !== null)
}
