export interface Dataset {
  id: number
  name: string
}
export interface Data {
  id: number
  [feature: string]: number | string // id + feature fields
}

export interface ProjectionRow {
  id: number
  x: number
  y: number
}

export interface Projection {
  id: number
  pos: Position
  original: Data
}

export interface FeatureStats {
  attributeName: number
  mean: number
  std: number
  min: number
  max: number
  normMean?: number // mean normalized to [0, 1]
  normStd?: number // std normalized to [0, 1]
}

export interface FingerprintFeatureStat {
  mean: number
  stddev: number
  globalMean: number
  normMean: number // 0–1 scaled
  meanDelta: number // relative to global mean
}

export interface Position {
  x: number
  y: number
}

export interface Point {
  item_id: number
  pos: Position
}

export type Fingerprint = {
  id: string // simple UUID
  name: string
  projectedPoints: Projection[]
  localStats: Record<string, FingerprintFeatureStat> // stats over the selected data points
}
