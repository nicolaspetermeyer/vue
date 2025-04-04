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
  id: string
  x: number
  y: number
  original: Data
}

export interface FeatureStats {
  mean: number
  std: number
  min: number
  max: number
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
