import axios from 'axios'
import type {
  Data,
  ProjectionApiResponse,
  AttributeStats,
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
  method: 'pca' | 'tsne' | 'umap',
  params?: {
    perplexity?: number
    n_neighbors?: number
    min_dist?: number
  },
): Promise<ProjectionApiResponse> {
  const requestParams: Record<string, any> = {
    filename,
    method,
  }
  if (params) {
    if (method === 'tsne' && params.perplexity !== undefined) {
      requestParams.perplexity = params.perplexity
    }
    if (method === 'umap') {
      if (params.n_neighbors !== undefined) {
        requestParams.n_neighbors = params.n_neighbors
      }
      if (params.min_dist !== undefined) {
        requestParams.min_dist = params.min_dist
      }
    }
  }
  const response = await api.get<ProjectionApiResponse>(`/projection/`, {
    params: requestParams,
  })
  return response.data
}

export async function fetchStats(filename: string): Promise<Record<string, AttributeStats>> {
  const response = await api.get<Record<string, AttributeStats>>(`/stats/`, {
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
  method: 'pca' | 'tsne' | 'umap' = 'pca',
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

export async function fetchSubsetProjection(
  dataset: string,
  method: 'pca' | 'tsne' | 'umap',
  pointIds: string[],
  params?: {
    perplexity?: number
    n_neighbors?: number
    min_dist?: number
  },
): Promise<{
  subsetProjection: boolean
  positionMapping: Record<string, { x: number; y: number }>
  subsetSize: number
}> {
  const requestParams: Record<string, any> = {
    filename: dataset,
    method: method,
  }

  // Add method-specific parameters
  if (params) {
    if (method === 'tsne' && params.perplexity !== undefined) {
      requestParams.perplexity = params.perplexity
    }
    if (method === 'umap') {
      if (params.n_neighbors !== undefined) {
        requestParams.n_neighbors = params.n_neighbors
      }
      if (params.min_dist !== undefined) {
        requestParams.min_dist = params.min_dist
      }
    }
  }

  const response = await api.post(`/projection/subset/`, pointIds, {
    params: requestParams,
  })
  return response.data
}

export async function fetchAttributeSubset(
  dataset: string,
  method: 'pca' | 'tsne' | 'umap',
  attributes: string[],
  params?: {
    perplexity?: number
    n_neighbors?: number
    min_dist?: number
  },
): Promise<{
  projectionData: any[]
  globalStats: Record<string, AttributeStats>
  numericAttributes: string[]
}> {
  const requestParams: Record<string, any> = {
    filename: dataset,
    method: method,
  }

  // Add method-specific parameters
  if (params) {
    if (method === 'tsne' && params.perplexity !== undefined) {
      requestParams.perplexity = params.perplexity
    }
    if (method === 'umap') {
      if (params.n_neighbors !== undefined) {
        requestParams.n_neighbors = params.n_neighbors
      }
      if (params.min_dist !== undefined) {
        requestParams.min_dist = params.min_dist
      }
    }
  }
  const response = await api.post(`/projection/attributes/`, attributes, {
    params: requestParams,
  })
  return response.data
}
