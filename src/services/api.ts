import axios from 'axios'
import type { Data, DRProjectionRow, FeatureStats, Dataset } from '@/models/data'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // adapt to your actual base path
})

export async function fetchRawData(filename: string): Promise<Data[]> {
  const response = await api.get<Data[]>(`/data/${filename}`)
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

export async function fetchDatasets(): Promise<Dataset[]> {
  const response = await api.get<Dataset[]>(`/datasets`)
  return response.data
}
