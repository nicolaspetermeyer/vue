from fastapi import FastAPI, HTTPException, APIRouter, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import Literal, List
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler
import os

app = FastAPI()
router = APIRouter()
projection_cache = {}


class ProjectionRequest(BaseModel):
    method: Literal["pca", "tsne"]
    filename: str


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow specified origins
    allow_credentials=True,  # Allow sending cookies/auth headers
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

DATA_DIR = "./data"  # Directory where CSV files are stored


def compute_tsne(data: np.ndarray):
    # Remove ID columns
    if isinstance(data, pd.DataFrame):
        # Filter out any ID-like columns
        id_cols = [col for col in data.columns if col.lower() == "id"]
        if id_cols:
            data = data.drop(columns=id_cols)

    df_scaled = StandardScaler().fit_transform(data)
    tsne = TSNE(
        n_components=2,
        perplexity=30,
        # random_state=42,
        learning_rate="auto",
        init="random",
        max_iter=250,
    )
    embedding = tsne.fit_transform(df_scaled)
    return embedding.tolist()


def compute_pca(data: np.ndarray, n_components: int = 2):
    # Remove ID columns
    if isinstance(data, pd.DataFrame):
        # Filter out any ID-like columns
        id_cols = [col for col in data.columns if col.lower() == "id"]
        if id_cols:
            data = data.drop(columns=id_cols)

    df_scaled = StandardScaler().fit_transform(data)
    pca = PCA(n_components=n_components)
    embedding = pca.fit_transform(df_scaled)
    return embedding.tolist()


def compute_local_variance(data: np.ndarray, proj: np.ndarray, radius: float):
    """
    Compute the local variance of each feature for every point based on its projection neighbors.

    Parameters
    ----------
    data : ndarray of shape (N, n)
        High-dimensional dataset where N is the number of samples and n is the number of features.
    proj : ndarray of shape (N, 2)
        2D coordinates of the corresponding projections P(p_i) for each data point.
    radius : float
        Neighborhood radius in projection space to consider around each projected point.

    Returns
    -------
    local_vars : ndarray of shape (N, n)
        For each point i and feature d, local_vars[i, d] gives the variance of feature d over
        the set v_i of original data points whose projections lie within `radius` of proj[i].
    """

    N, n = data.shape
    local_vars = np.zeros((N, n), dtype=np.float64)

    # For each point, find its neighbors in projection space and compute variances
    for i in range(N):
        # Compute Euclidean distances in projection space
        diffs = proj - proj[i]  # shape (N, 2)
        dists = np.hypot(diffs[:, 0], diffs[:, 1])

        # Identify neighborhood v_i
        inds = np.nonzero(dists < radius)[0]
        if inds.size == 0:
            # No neighbors found within radius; leave variances at zero
            continue

        # Extract corresponding high-dimensional points
        vi = data[inds]  # shape (|v_i|, n)

        # Compute mean for each feature over v_i
        mean_vi = vi.mean(axis=0)  # shape (n,)

        # Compute population variance: 1/|v_i| * sum((p^d - mean_vi[d])^2)
        var_vi = ((vi - mean_vi) ** 2).mean(axis=0)

        local_vars[i] = var_vi

    return local_vars


def compute_feature_ranking(local_vars, global_vars):
    """
    Compute normalized local-to-global variance ranks ξ_i^d for each point i and feature d.

    Parameters
    ----------
    local_vars : ndarray of shape (N, n)
        Local variances LV_i^d per point i and feature d.
    global_vars : ndarray of shape (n,)
        Global variances GV^d per feature d.

    Returns
    -------
    xi : ndarray of shape (N, n)
        Normalized scores ξ_i^d = (LV_i^d / GV^d) / sum_j (LV_i^j / GV^j).
    ranking : ndarray of shape (N, n)
        For each point i, indices of features sorted by descending ξ_i^d.
    """

    # Avoid division by zero
    gv = np.where(global_vars == 0, np.finfo(float).eps, global_vars)

    # Normalize local variances by global variances
    norm_lv = local_vars / gv[np.newaxis, :]

    # Sum across features to normalize each point's scores
    sums = norm_lv.sum(axis=1, keepdims=True)

    # Avoid division by zero - replace zero sums with small epsilon
    sums = np.where(sums == 0, np.finfo(float).eps, sums)

    xi = norm_lv / sums

    # Ranking: argsort in descending order of xi
    ranking = np.argsort(-xi, axis=1)

    return xi, ranking


def read_csv_file(filename: str):
    """
    Read a CSV file and return its content as a DataFrame.
    """
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid file name")
    file_path = os.path.join(DATA_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV file: {e}")
    return df


@app.get("/api/datasets/")
async def list_datasets():
    """
    List all available CSV files in the backend.
    """
    files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
    return [{"id": idx + 1, "name": file} for idx, file in enumerate(files)]


@app.get("/api/data/{filename}")
async def get_file_data(filename: str):
    """
    Retrieve data from the selected CSV file.
    """
    df = read_csv_file(filename)

    # Normalize any column named 'ID', 'Id', etc. to lowercase 'id'
    df.rename(
        columns={col: "id" for col in df.columns if col.lower() == "id"}, inplace=True
    )
    df_numeric = df.select_dtypes(include=["number"]).reset_index(drop=True)

    return df_numeric.to_dict(orient="records")


@app.get("/api/projection/")
async def project_data(
    filename: str = Query(...),
    method: Literal["pca", "tsne"] = "pca",
):
    """
    Perform PCA or t-SNE on the provided data.

    Args:
        request (ProjectionRequest): Request body containing projection method and data.

    Returns:
        JSON: Projected data.
    """
    key = (filename, method)

    if key in projection_cache:
        return projection_cache[key]

    df = read_csv_file(filename)
    df_numeric = df.select_dtypes(include=["number"])

    if method == "pca":
        projected_data = compute_pca(df_numeric)
    elif method == "tsne":
        projected_data = compute_tsne(df_numeric)
    else:
        raise HTTPException(status_code=400, detail="Invalid projection method")

    # Get row identifiers from the original dataframe
    if "id" in df.columns:
        ids = df["id"].astype(str).tolist()
    else:
        ids = [f"{i}" for i in range(len(df))]

    projection = [
        {
            "id": ids[i],
            "x": float(projected_data[i][0]),
            "y": float(projected_data[i][1]),
        }
        for i in range(len(ids))
    ]

    projection_cache[key] = projection

    return projection


@app.get("/api/stats/")
async def get_feature_stats(filename: str):
    """
    Compute basic statistics (mean, std, min, max) for each numeric feature.
    """
    df = read_csv_file(filename)
    df_numeric = df.select_dtypes(include=["number"])

    stats = {}
    for col in df_numeric.columns:
        if col.lower() == "id":
            continue

        col_data = df_numeric[col]
        mean = col_data.mean()
        std = col_data.std()
        min_val = col_data.min()
        max_val = col_data.max()

        stats[col] = {
            "mean": float(mean),
            "std": float(std),
            "min": float(min_val),
            "max": float(max_val),
            "normMean": (
                float((mean - min_val) / (max_val - min_val))
                if max_val > min_val
                else 0
            ),
            "normStd": float(std / (max_val - min_val)) if max_val > min_val else 0,
        }

    return stats


@app.get("/api/feature-ranking/")
async def get_feature_ranking(
    filename: str, method: Literal["pca", "tsne"] = "pca", radius: float = 0.1
):
    """
    Compute variance-based feature ranking for each point in the dataset.

    Args:
        filename (str): Name of the CSV file to analyze
        method (str): Projection method to use ('pca' or 'tsne')
        radius (float): Neighborhood radius to consider in projection space

    Returns:
        JSON with feature ranking information for each point
    """
    # Get the original data
    df = read_csv_file(filename)
    df_numeric = df.select_dtypes(include=["number"])
    id_cols = [col for col in df_numeric.columns if col.lower() == "id"]
    if id_cols:
        df_numeric = df_numeric.drop(columns=id_cols)

    # Store original row IDs for returning results
    if "id" in df.columns:
        row_ids = df["id"].astype(str).tolist()
    else:
        row_ids = [f"{i}" for i in range(len(df))]

    # Get the projection (or compute it if not cached)
    key = (filename, method)
    if key not in projection_cache:
        # Use the existing projection endpoint to compute and cache
        await project_data(filename=filename, method=method)
    projection_data = projection_cache[key]

    # Extract the projection coordinates as numpy array
    proj_coords = np.array([[item["x"], item["y"]] for item in projection_data])

    # Compute local variances
    local_vars = compute_local_variance(df_numeric.values, proj_coords, radius)

    # Compute global variances for each feature
    global_vars = df_numeric.var().values

    # Compute feature ranking
    xi_scores, rankings = compute_feature_ranking(local_vars, global_vars)

    # Prepare results
    feature_names = df_numeric.columns.tolist()

    result = []
    for i in range(len(df_numeric)):
        # Get feature names in order of importance for this point
        ranked_features = [feature_names[feat_idx] for feat_idx in rankings[i]]

        # Get corresponding importance scores
        importance_scores = [float(xi_scores[i, feat_idx]) for feat_idx in rankings[i]]

        point_result = {
            "id": row_ids[i],
            "features": ranked_features,
            "scores": importance_scores,
        }
        result.append(point_result)

    return result


# Run the server using:
# uvicorn script_name:app --reload
# uvicorn backend.mock_server:app --reload
