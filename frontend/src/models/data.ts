export interface Dataset {
  id: number
  name: string
}
export interface Data {
  id: string
  [feature: string]: number | string // id + feature fields
}

export interface Projection {
  id: string
  pos: Position
  original: Data
}

export interface ProjectionApiResponse {
  projectionData: Projection[]
  globalStats: Record<string, FeatureStats>
  nonNumericAttributes: string[] | null
  categoryValues: Record<string, string[]>
}

export interface FeatureStats {
  // Core statistics
  mean: number
  std: number
  min?: number // Only required for global stats
  max?: number // Only required for global stats

  // Normalized values
  normMean: number // Value normalized to [0, 1] range
  normStd?: number // Optional for local stats

  // Reference data (for local stats)
  globalMean?: number // Reference to global mean (for local stats)
  meanDelta?: number // Difference from reference mean (for local stats)

  // Metadata
  attributeName?: number // Optional metadata
  isNumeric?: boolean // Used primarily with global stats

  // Flags
  isGlobal: boolean
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
  localStats: Record<string, FeatureStats>
  centroid: Position
  color: number
}

export type FeatureRanking = {
  id: string
  features: string[]
  scores: number[]
}
