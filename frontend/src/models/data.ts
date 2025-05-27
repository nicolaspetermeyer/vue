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
  parentId?: string
}

export interface AttributeMetadata {
  categories: Record<string, string>
}

export interface ProjectionApiResponse {
  projectionData: Projection[]
  globalStats: Record<string, AttributeStats>
  nonNumericAttributes: string[] | null
  categoryValues: Record<string, string[]>
  numericAttributes: string[]
  attributeMetadata?: {
    attributeMetadata: Record<string, AttributeMetadata>
    attributes: string[]
    categoryList: string[]
  }
}

export interface AttributeStats {
  // Core statistics
  mean: number
  normMean: number
  std: number
  min: number
  max: number

  // Reference data (for local stats)
  globalMean?: number // Reference to global mean (for local stats)
  globalNormMean?: number // Reference to global normalized mean (for local stats)
  meanDelta?: number // Difference from reference mean (for local stats)

  // Metadata
  attributeName?: string // Optional metadata
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
  id: string
  name: string
  projectedPoints: Projection[]
  localStats: Record<string, AttributeStats>
  centroid: Position
  color: number
  parentId?: string
  childIds: string[]
  depth?: number
}

export type FeatureRanking = {
  id: string
  features: string[]
  scores: number[]
}
