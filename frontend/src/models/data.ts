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

export interface Projection {
  id: string
  pos: Position
  original: Data
  nonNumericAttributes: string[]
}

export interface ProjectionApiResponse {
  projectionData: Projection[]
  globalStats: Record<string, FeatureStats>
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
  isGlobal: boolean // Indicates if these are global or local stats
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
  localStats: Record<string, FeatureStats> // stats over the selected data points
}

export type FeatureRanking = {
  id: string
  features: string[]
  scores: number[]
}
