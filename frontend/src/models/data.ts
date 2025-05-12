export interface Dataset {
  id: number
  name: string
}
export interface Data {
  id: string
  [feature: string]: number | string // id + feature fields
}

export interface ColumnMetadata {
  isNumeric: boolean
  [property: string]: any
}

export interface DataResponse {
  data: Data[]
  metadata: {
    columns: Record<string, ColumnMetadata>
  }
}

export interface ProjectionRow {
  id: string
  x: number
  y: number
}

export interface Projection {
  id: string
  pos: Position
  original: Data
  nonNumericAttributes?: string[]
}

export interface FeatureStats {
  attributeName: number
  mean: number
  std: number
  min: number
  max: number
  normMean?: number // mean normalized to [0, 1]
  normStd?: number // std normalized to [0, 1]
  isNumeric: boolean
  uniqueValues?: number
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
  item_id: string
  pos: Position
}

export type Fingerprint = {
  id: string // simple UUID
  name: string
  projectedPoints: Projection[]
  localStats: Record<string, FingerprintFeatureStat> // stats over the selected data points
}

export type FeatureRanking = {
  id: string
  features: string[]
  scores: number[]
}
