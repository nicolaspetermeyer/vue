import axios from 'axios'
import type {
  Data,
  Projection,
  ProjectionApiResponse,
  GlobalFeatureStats,
  Dataset,
  FeatureRanking,
} from '@/models/data'

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

export async function fetchProjection(
  filename: string,
  method: 'pca' | 'umap' | 'tsne',
): Promise<ProjectionApiResponse> {
  const response = await api.get<ProjectionApiResponse>(`/projection/`, {
    params: {
      filename,
      method,
    },
  })
  return response.data
}

export async function fetchStats(filename: string): Promise<Record<string, GlobalFeatureStats>> {
  const response = await api.get<Record<string, GlobalFeatureStats>>(`/stats/`, {
    params: {
      filename,
    },
  })
  return response.data
}

export async function fetchDatasets(): Promise<Dataset[]> {
  const response = await api.get<Dataset[]>(`/datasets`)
  return response.data
}

export async function fetchFeatureRanking(
  dataset: string,
  method: 'pca' | 'tsne' = 'pca',
  radius: number = 0.2,
): Promise<FeatureRanking[]> {
  const response = await api.get<FeatureRanking[]>(`/feature-ranking/`, {
    params: {
      filename: dataset,
      method: method,
      radius: radius.toString(),
    },
  })

  return response.data
}
