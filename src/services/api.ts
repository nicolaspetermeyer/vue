import axios from 'axios'
import type { RawDataPoint, DRProjectionRow, FeatureStats } from '@/models/data'

const api = axios.create({
  baseURL: '/api', // adapt to your actual base path
})

export async function fetchRawData(filename: string): Promise<RawDataPoint[]> {
  const response = await api.get<RawDataPoint[]>(`/data/${filename}`)
  return response.data
}

export async function fetchProjection(filename: string): Promise<DRProjectionRow[]> {
  const response = await api.get<DRProjectionRow[]>(`/projection/${filename}`)
  return response.data
}

export async function fetchStats(filename: string): Promise<Record<string, FeatureStats>> {
  const response = await api.get<Record<string, FeatureStats>>(`/stats/${filename}`)
  return response.data
}
