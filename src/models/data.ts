export interface Dataset {
  id: number
  name: string
}
export interface RawDataPoint {
  id: string
  [feature: string]: number | string // id + feature fields
}

export interface DRProjectionRow {
  id: string
  x: number
  y: number
}

export interface ProjectedPoint {
  id: string
  x: number
  y: number
  original: RawDataPoint
}

export interface FeatureStats {
  mean: number
  std: number
  min: number
  max: number
}

export interface DatasetMetadata {
  featureNames: string[]
  stats: Record<string, FeatureStats>
}
