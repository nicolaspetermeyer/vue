import axios from 'axios'
import type { Data, ProjectionRow, FeatureStats, Dataset } from '@/models/data'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function fetchRawData(filename: string): Promise<Data[]> {
  const response = await api.get<Data[]>(`/data/${filename}`)
  return response.data
}

export async function fetchProjection(filename: string): Promise<ProjectionRow[]> {
  const response = await api.get<ProjectionRow[]>(`/projection/${filename}`)
  return response.data
}

export async function fetchProjectionbyMethod(
  filename: string,
  method: 'pca' | 'umap' | 'tsne',
): Promise<ProjectionRow[]> {
  const response = await api.get<ProjectionRow[]>(`/projection/`, {
    params: {
      filename,
      method,
    },
  })
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
