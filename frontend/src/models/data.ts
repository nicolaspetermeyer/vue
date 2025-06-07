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
  basePos?: Position
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
    categoryUniqueValues: Record<string, string[]>
  }
}

export interface AttributeStats {
  // Core statistics
  mean: number // global
  normMean: number // global
  std: number
  min: number
  max: number
  median: number
  q25: number
  q75: number
  iqr: number

  localMean?: number
  localNormMean?: number
  meanDelta?: number

  // Metadata
  attributeName?: string
  isNumeric?: boolean

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

export type ProjectionHistoryState = {
  projection: Projection[]
  stats: Record<string, AttributeStats>
  parentId?: string
  originalPositions?: Map<string, { x: number; y: number }>
}
