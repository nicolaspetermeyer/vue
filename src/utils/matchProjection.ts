import type { RawDataPoint, DRProjectionRow, ProjectedPoint } from '@/models/data'

export function matchProjection(
  rawData: RawDataPoint[],
  projection: DRProjectionRow[],
): ProjectedPoint[] {
  const rawMap = new Map<string, RawDataPoint>()

  for (const d of rawData) {
    rawMap.set(String(d.id).trim(), d) // <-- normalize to string
  }

  return projection
    .map(({ id, x, y }) => {
      const key = String(id).trim() // <-- also normalize to string
      const original = rawMap.get(key)
      if (!original) {
        console.warn(`⚠️ No rawData match for projected point ID: ${key}`)
        return null
      }

      return {
        id: key,
        x,
        y,
        original,
      }
    })
    .filter((p): p is ProjectedPoint => p !== null)
}
