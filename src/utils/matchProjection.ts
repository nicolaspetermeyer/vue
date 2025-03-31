import type { RawDataPoint, DRProjectionRow, ProjectedPoint } from '@/models/data'

export function matchProjection(raw: RawDataPoint[], dr: DRProjectionRow[]): ProjectedPoint[] {
  const map = new Map(raw.map((r) => [r.id, r]))
  return dr.map(({ id, x, y }) => ({
    id,
    x,
    y,
    original: map.get(id)!,
  }))
}
