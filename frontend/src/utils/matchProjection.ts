import type { Data, ProjectionRow, Projection, GlobalFeatureStats } from '@/models/data'

export function matchProjection(rawData: Data[], projection: ProjectionRow[]): Projection[] {
  const rawMap = new Map<string, Data>()

  for (const d of rawData) {
    rawMap.set(d.id, d)
  }

  return projection
    .map(({ id, x, y }) => {
      const original = rawMap.get(id)
      if (!original) {
        console.warn(`⚠️ No rawData match for projected point ID: ${id}`)

        return null
      }

      return {
        id,
        pos: { x, y },
        original,
      } as Projection
    })
    .filter((p): p is Projection => p !== null)
}
