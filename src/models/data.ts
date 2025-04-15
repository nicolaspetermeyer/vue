export interface Dataset {
  id: number
  name: string
}
export interface Data {
  id: string
  [feature: string]: number | string // id + feature fields
}

export interface ProjectionRow {
  id: string
  x: number
  y: number
}

export interface Projection {
  id: number
  pos: Position
  original: Data
}

export interface FeatureStats {
  attributeName: string
  mean: number
  std: number
  min: number
  max: number
  normMean?: number // mean normalized to [0, 1]
  normStd?: number // std normalized to [0, 1]
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
  points: Point[]
}
