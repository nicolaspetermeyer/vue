from fastapi import FastAPI, HTTPException, APIRouter, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import Literal, List, Dict, Any, Optional, Tuple
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import umap
from sklearn.preprocessing import StandardScaler
import os

app = FastAPI()
router = APIRouter()
# projection_cache = {}
# stats_cache = {}
# feature_ranking_cache = {}
dataset_cache = {}


class ProjectionRequest(BaseModel):
    method: Literal["pca", "tsne", "umap"]
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

DATA_DIR = "../data"  # Directory where CSV files are stored


class DatasetInfo:
    """Container for dataset information and metadata"""

    def __init__(
        self,
        df: pd.DataFrame,
        numeric_cols: List[str],
        non_numeric_cols: List[str],
        column_types: Dict[str, Dict[str, Any]],
        numeric_df: pd.DataFrame,
    ):
        self.df = df
        self.numeric_cols = numeric_cols
        self.non_numeric_cols = non_numeric_cols
        self.column_types = column_types
        self.numeric_df = df[numeric_cols] if numeric_cols else pd.DataFrame()
        self.dr_numeric_cols = []
        self.dr_numeric_df = pd.DataFrame()
        self.tagged_categorical_columns = []

        # Extract row identifiers
        if "id" in df.columns:
            self.ids = df["id"].astype(str).tolist()
        else:
            self.ids = [f"{i}" for i in range(len(df))]


# ============================================================================
# DATA PREPROCESSING PIPELINE
# ============================================================================


def process_column_names(df):
    """
    Process column names to identify and handle columns with [cat] tag.

    Args:
        df: DataFrame to process

    Returns:
        Tuple of (processed_df, categorical_columns)
    """
    categorical_columns = []
    rename_mapping = {}

    for col in df.columns:
        if " [cat]" in col:
            # Remove the [cat] tag from the column name
            base_name = col.replace(" [cat]", "")
            rename_mapping[col] = base_name
            categorical_columns.append(base_name)

    # Rename columns to remove [cat] tags
    if rename_mapping:
        df = df.rename(columns=rename_mapping)

    return df, categorical_columns


def preprocess_dataset(filename: str) -> DatasetInfo:
    """
    Comprehensive dataset preprocessing pipeline that:
    1. Loads and normalizes the dataset
    2. Categorizes columns
    3. Creates metadata
    4. Returns everything needed by downstream processing

    Args:
        filename: Name of the dataset to process

    Returns:
        DatasetInfo object with processed dataset and metadata
    """
    # Check if we have this dataset already preprocessed in cache
    # if filename in dataset_cache:
    #     return dataset_cache[filename]

    # Load the raw data
    df = read_csv_file(filename)

    # Process columns with [cat] tags
    df, tagged_categorical_columns = process_column_names(df)

    # Normalize column names
    df.rename(
        columns={col: "id" for col in df.columns if col.lower() == "id"}, inplace=True
    )

    # Ensure ID column exists and is string type
    if "id" in df.columns:
        df["id"] = df["id"].astype(str)
    else:
        df["id"] = [f"point-{i}" for i in range(len(df))]

    # Identify column types
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    non_numeric_cols = [
        col for col in df.columns if col not in numeric_cols and col.lower() != "id"
    ]

    # Create filtered numeric columns for dimensionality reduction
    dr_numeric_cols = [
        col for col in numeric_cols if col not in tagged_categorical_columns
    ]

    numeric_df = df[numeric_cols] if numeric_cols else pd.DataFrame()
    dr_numeric_df = df[dr_numeric_cols] if dr_numeric_cols else pd.DataFrame()

    # Create column metadata
    column_types = {
        col: {
            "isNumeric": col in numeric_cols,
            "isCategorical": col in tagged_categorical_columns,
        }
        for col in df.columns
        if col.lower() != "id"
    }

    # Create dataset info object
    info = DatasetInfo(df, numeric_cols, non_numeric_cols, column_types, numeric_df)

    info.dr_numeric_cols = dr_numeric_cols
    info.dr_numeric_df = dr_numeric_df
    info.tagged_categorical_columns = tagged_categorical_columns

    __all__ = ["app", "info", "DatasetInfo"]

    # Cache this processed dataset
    dataset_cache[filename] = info

    return info


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
        df = pd.read_csv(file_path, encoding="utf-8")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV file: {e}")
    return df


def load_attribute_metadata(target_filename: str) -> Dict[str, Any]:
    """
    Load attribute metadata from VotingAttributeMetadata.csv and match it to attributes
    in the target dataset.

    Args:
        target_filename: Name of the dataset to match metadata with

    Returns:
        Dictionary containing attribute metadata
    """
    # Only process metadata for the voting or breast dataset
    if (
        target_filename != "Voting-data-cleaned.csv"
        and target_filename != "breastCancer.csv"
    ):
        return {}
    if target_filename == "Voting-data-cleaned.csv":
        metadata_path = os.path.join("../metadata/VotingAttributeMetadata.csv")
    elif target_filename == "breastCancer.csv":
        metadata_path = os.path.join("../metadata/BreastCancerMetadata.csv")

    # Check if metadata file exists
    if not os.path.exists(metadata_path):
        print(f"Warning: Metadata file not found at {metadata_path}")
        return {}

    try:
        # Read metadata CSV
        metadata_df = pd.read_csv(metadata_path, encoding="utf-8")

        # First row contains the attribute names
        attributes = metadata_df.columns[1:].tolist()
        # Get category names from the first column
        categories = metadata_df.iloc[:, 0].tolist()

        # Process metadata for each attribute
        attribute_metadata = {}

        # Pre-compute unique values for each category
        category_unique_values = {category: set() for category in categories}

        for col in metadata_df.columns[1:]:
            # Create category-value mappings for this attribute
            category_values = {}
            for idx, category in enumerate(categories):
                if idx < len(metadata_df):
                    value = metadata_df.iloc[idx][col]
                    category_values[category] = value

                    if pd.notna(value) and value:
                        category_unique_values[category].add(value)

            # Store structured metadata for this attribute
            attribute_metadata[col] = {
                "categories": category_values,
            }

        category_unique_values = {
            category: sorted(list(values))
            for category, values in category_unique_values.items()
        }

        return {
            "attributeMetadata": attribute_metadata,
            "attributes": attributes,
            "categoryList": categories,
            "categoryUniqueValues": category_unique_values,
        }

    except Exception as e:
        print(f"Error loading metadata: {e}")
        return {}


# ============================================================================
# PROJECTION METHODS
# ============================================================================


def compute_pca(data, n_components: int = 2) -> List[List[float]]:
    """Compute PCA projection"""
    if isinstance(data, pd.DataFrame):
        print("calculating pca")
        # Filter out any ID-like columns
        id_cols = [col for col in data.columns if col.lower() == "id"]
        if id_cols:
            data = data.drop(columns=id_cols)

    df_scaled = StandardScaler().fit_transform(data)
    pca = PCA(n_components=n_components)
    embedding = pca.fit_transform(df_scaled)
    # loadings = pca.components_.T
    # explained_var = pca.explained_variance_ratio_

    # # Calculate feature attribution based on squared loadings
    # squared_loadings = loadings**2
    # feature_attribution = np.sum(squared_loadings, axis=1)

    # # Calculate weighted feature attribution based on explained variance
    # weighted_loadings = squared_loadings * explained_var
    # feature_attribution_weighted = np.sum(weighted_loadings, axis=1)

    # # Normalize feature attribution to get relative contributions
    # relative_contribution = feature_attribution / np.sum(feature_attribution)
    # relative_contribution_weighted = feature_attribution_weighted / np.sum(
    #     feature_attribution_weighted
    # )

    # if isinstance(data, pd.DataFrame):
    #     for i, col in enumerate(data.columns):
    #         feature_contributions[col] = float(relative_contribution_weighted[i])
    # else:
    #     # If not a DataFrame, use indices as column names
    #     for i in range(len(relative_contribution_weighted)):
    #         feature_contributions[f"feature_{i}"] = float(
    #             relative_contribution_weighted[i]
    #         )

    return embedding.tolist()


def compute_tsne(data) -> List[List[float]]:
    """Compute t-SNE projection"""
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
        learning_rate="auto",
        init="random",
        max_iter=250,
    )
    embedding = tsne.fit_transform(df_scaled)
    return embedding.tolist()


def compute_umap(data) -> List[List[float]]:
    """Compute UMAP projection"""
    # Remove ID columns
    if isinstance(data, pd.DataFrame):
        # Filter out any ID-like columns
        id_cols = [col for col in data.columns if col.lower() == "id"]
        if id_cols:
            data = data.drop(columns=id_cols)

    df_scaled = StandardScaler().fit_transform(data)
    reducer = umap.UMAP(
        n_components=2,
        n_neighbors=15,
        min_dist=0.1,
        metric="euclidean",
    )

    embedding = reducer.fit_transform(df_scaled)
    # Convert to standard numpy array and then to list to handle various return types
    if isinstance(embedding, tuple):  # For tuple returns
        return np.array(embedding).tolist()
    elif hasattr(embedding, "toarray"):  # For sparse matrices
        return embedding.toarray().tolist()
    else:  # For numpy arrays
        return np.array(embedding).tolist()


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
    sums = np.where(sums == 0, np.finfo(float).eps, sums)
    xi = norm_lv / sums

    # Ranking: argsort in descending order of xi
    ranking = np.argsort(-xi, axis=1)

    return xi, ranking


# ============================================================================
# API ROUTES
# ============================================================================
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
    dataset_info = preprocess_dataset(filename)
    data_records = dataset_info.df.to_dict(orient="records")

    return {"data": data_records, "metadata": {"columns": dataset_info.column_types}}


@app.get("/api/organized-data/{filename}")
async def get_organized_data(filename: str):
    """
    Return data pre-organized with non-numeric attributes separated
    """
    # Get processed dataset
    dataset_info = preprocess_dataset(filename)

    # Create organized records
    organized_data = []
    for _, row in dataset_info.df.iterrows():
        item_id = row["id"]

        # Split attributes by type
        numeric_attrs = {col: row[col] for col in dataset_info.numeric_cols}

        non_numeric_attrs = {col: row[col] for col in dataset_info.non_numeric_cols}

        organized_data.append(
            {"id": item_id, "numeric": numeric_attrs, "nonNumeric": non_numeric_attrs}
        )

    return organized_data


@app.get("/api/projection/")
async def project_data(
    filename: str = Query(...),
    method: Literal["pca", "tsne", "umap"] = "pca",
):
    """
    Perform PCA, t-SNE or umap on the provided data.

    Args:
        request (ProjectionRequest): Request body containing projection method and data.

    Returns:
        JSON: Projected data.
    """
    key = (filename, method)

    # if key in projection_cache:
    #     return projection_cache[key]

    dataset_info = preprocess_dataset(filename)

    original_data = await get_file_data(filename)
    global_stats = await get_global_stats(filename, method)

    # Check if we have numeric data to project
    if len(dataset_info.numeric_cols) == 0:
        raise HTTPException(
            status_code=400, detail="No numeric columns available for projection"
        )

    # Perform projection

    if method == "pca":
        projected_data = compute_pca(dataset_info.dr_numeric_df)
    elif method == "tsne":
        projected_data = compute_tsne(dataset_info.dr_numeric_df)
    elif method == "umap":
        projected_data = compute_umap(dataset_info.dr_numeric_df)
    else:
        raise HTTPException(status_code=400, detail="Invalid projection method")

    # Create projection result
    projection = [
        {
            "id": dataset_info.ids[i],
            "x": float(projected_data[i][0]),
            "y": float(projected_data[i][1]),
        }
        for i in range(len(dataset_info.ids))
    ]

    id_to_original = {item["id"]: item for item in original_data["data"]}

    category_values = {}
    for col in dataset_info.non_numeric_cols:
        unique_vals = dataset_info.df[col].unique()
        category_values[col] = [str(val) for val in unique_vals]

    for col in dataset_info.tagged_categorical_columns:
        if col in dataset_info.numeric_cols:  # Only process if it's a numeric column
            unique_values = dataset_info.df[col].dropna().unique().tolist()
            sorted_values = sorted(unique_values)

            category_values[col] = sorted_values
            if col not in dataset_info.non_numeric_cols:
                dataset_info.non_numeric_cols.append(col)

    matched_data = []
    for point in projection:
        point_id = point["id"]
        if point_id in id_to_original:
            matched_data.append(
                {
                    "id": point_id,
                    "pos": {"x": point["x"], "y": point["y"]},
                    "original": id_to_original[point_id],
                }
            )

    attribute_metadata = load_attribute_metadata(filename)

    result = {
        "projectionData": matched_data,
        "globalStats": global_stats,
        "nonNumericAttributes": dataset_info.non_numeric_cols,
        "categoryValues": category_values,
        "numericAttributes": dataset_info.numeric_cols,
    }

    if attribute_metadata:

        result["attributeMetadata"] = attribute_metadata

    # projection_cache[key] = result

    return result


@app.get("/api/stats/")
async def get_global_stats(filename: str, method: str):
    """
    Compute basic statistics for each numeric feature.
    """

    # cache_key = (filename, method)
    # if cache_key in stats_cache:
    #     return stats_cache[cache_key]

    dataset_info = preprocess_dataset(filename)

    stats = {}

    # Process numeric columns
    for col in dataset_info.numeric_cols:
        if col.lower() == "id":
            continue

        col_data = dataset_info.df[col]
        mean = col_data.mean()
        median = col_data.median()
        std = col_data.std()
        variance = col_data.var()
        min_val = col_data.min()
        max_val = col_data.max()
        quartile_25 = col_data.quantile(0.25)
        quartile_75 = col_data.quantile(0.75)
        iqr = quartile_75 - quartile_25
        range_val = max_val - min_val
        norm_mean = (mean - min_val) / range_val if range_val > 0 else 0
        norm_std = std / range_val if range_val > 0 else 0
        norm_var = variance / range_val**2 if range_val > 0 else 0

        col_stats = {
            "mean": float(mean),
            "median": float(median),
            "std": float(std),
            "var": variance,
            "min": float(min_val),
            "max": float(max_val),
            "q25": float(quartile_25),
            "q75": float(quartile_75),
            "normMean": float(norm_mean),
            "normStd": float(norm_std),
            "normVar": float(norm_var),
            "isNumeric": True,
        }

        stats[col] = col_stats
    # Process non-numeric columns
    # for col in dataset_info.non_numeric_cols:
    #     unique_values = dataset_info.df[col].nunique()
    #     stats[col] = {"isNumeric": False, "uniqueValues": int(unique_values)}

    # stats_cache[cache_key] = stats
    return stats


# @app.get("/api/feature-ranking/")
# async def get_feature_ranking(
#     filename: str, method: Literal["pca", "tsne", "umap"] = "pca", radius: float = 0.1
# ):
#     """
#     Compute variance-based feature ranking for each point in the dataset.

#     Args:
#         filename (str): Name of the CSV file to analyze
#         method (str): Projection method to use ('pca', 'tsne' or 'umap')
#         radius (float): Neighborhood radius to consider in projection space

#     Returns:
#         JSON with feature ranking information for each point
#     """
#     # cache_key = (filename, method, radius)
#     # if cache_key in feature_ranking_cache:
#     #     return feature_ranking_cache[cache_key]

#     # Get the original data
#     dataset_info = preprocess_dataset(filename)

#     # Check if we have numeric data to analyze
#     if len(dataset_info.numeric_cols) == 0:
#         raise HTTPException(
#             status_code=400, detail="No numeric columns available for feature ranking"
#         )

#     # Get the projection (or compute it if not cached)
#     # key = (filename, method)
#     # if key not in projection_cache:
#     #     # Use the existing projection endpoint to compute and cache
#     #     await project_data(filename=filename, method=method)
#     # projection_data = projection_cache[key]

#     # Extract the projection coordinates as numpy array
#     proj_coords = np.array([[item["x"], item["y"]] for item in projection_data])

#     # Compute local variances
#     local_vars = compute_local_variance(
#         dataset_info.numeric_df.values, proj_coords, radius
#     )
#     # Compute global variances for each feature
#     global_vars = dataset_info.numeric_df.var().values

#     # Compute feature ranking
#     xi_scores, rankings = compute_feature_ranking(local_vars, global_vars)

#     # Prepare results
#     feature_names = dataset_info.numeric_cols

#     result = []
#     for i in range(len(dataset_info.numeric_df)):
#         # Get feature names in order of importance for this point
#         ranked_features = [feature_names[feat_idx] for feat_idx in rankings[i]]

#         # Get corresponding importance scores
#         importance_scores = [float(xi_scores[i, feat_idx]) for feat_idx in rankings[i]]

#         point_result = {
#             "id": dataset_info.ids[i],
#             "features": ranked_features,
#             "scores": importance_scores,
#         }
#         result.append(point_result)

#     # feature_ranking_cache[cache_key] = result
#     return result


@app.post("/api/projection/subset/")
async def project_data_subset(
    filename: str = Query(...),
    method: Literal["pca", "tsne", "umap"] = "pca",
    point_ids: List[str] = Body(...),
):
    """
    Perform PCA, t-SNE or umap on a subset of points identified by their IDs.
    Returns only the new positions to minimize payload size.

    Args:
        filename: Name of the dataset file
        method: Projection method ('pca', 'tsne', 'umap')
        point_ids: List of point IDs to include in the calculation

    Returns:
        JSON: New positions for the subset points
    """
    # Check if full projection exists in cache
    # full_key = (filename, method)
    # if full_key not in projection_cache:
    #     await project_data(filename, method)

    dataset_info = dataset_cache[filename]

    point_ids_set = set(point_ids)
    id_to_idx = {id_val: idx for idx, id_val in enumerate(dataset_info.ids)}
    filtered_indices = [
        id_to_idx[id_val] for id_val in point_ids_set if id_val in id_to_idx
    ]

    if not filtered_indices:
        raise HTTPException(
            status_code=400, detail="No matching points found for the provided IDs"
        )

    subset_df = dataset_info.numeric_df.iloc[filtered_indices]
    if dataset_info.tagged_categorical_columns:
        subset_df = subset_df.drop(columns=dataset_info.tagged_categorical_columns)

    if method == "pca":
        projected_data = compute_pca(subset_df)
    elif method == "tsne":
        projected_data = compute_tsne(subset_df)
    elif method == "umap":
        projected_data = compute_umap(subset_df)

    # Create minimal response with just the new positions
    position_mapping = {}
    for i, idx in enumerate(filtered_indices):
        point_id = dataset_info.ids[idx]
        position_mapping[point_id] = {
            "x": float(projected_data[i][0]),
            "y": float(projected_data[i][1]),
        }

    result = {
        "subsetProjection": True,
        "positionMapping": position_mapping,
        "subsetSize": len(position_mapping),
    }
    return result


@app.post("/api/projection/attributes/")
async def project_data_with_attributes(
    filename: str = Query(...),
    method: Literal["pca", "tsne", "umap"] = "pca",
    attributes: List[str] = Body(...),
):
    """
    Perform PCA, t-SNE or umap on the dataset using only the specified attributes.
    Reuses cached dataset but computes a new projection.

    Args:
        filename: Name of the dataset file
        method: Projection method ('pca', 'tsne', 'umap')
        attributes: List of attribute names to include in the calculation

    Returns:
        JSON: New projection data calculated only with the specified attributes
    """
    # Check if full projection exists in cache
    # full_key = (filename, method)
    # if full_key not in projection_cache:
    #     await project_data(filename=filename, method=method)

    # Get the full projection data to preserve original attributes
    # full_projection = projection_cache[full_key]

    dataset_info = dataset_cache[filename]

    # Ensure requested attributes exist in the dataset
    valid_attributes = [
        attr for attr in attributes if attr in dataset_info.numeric_cols
    ]

    if not valid_attributes:
        raise HTTPException(
            status_code=400,
            detail="No valid numeric attributes provided for projection",
        )

    # Create filtered dataset with only specified attributes
    filtered_df = dataset_info.df[valid_attributes]

    # Compute the new projection

    if method == "pca":
        projected_data = compute_pca(filtered_df)
    elif method == "tsne":
        projected_data = compute_tsne(filtered_df)
    elif method == "umap":
        projected_data = compute_umap(filtered_df)
    else:
        raise HTTPException(status_code=400, detail="Invalid projection method")

    filtered_stats = {}
    for col in valid_attributes:
        col_data = dataset_info.df[col]
        mean = col_data.mean()
        std = col_data.std()
        min_val = col_data.min()
        max_val = col_data.max()
        range_val = max_val - min_val
        norm_mean = (mean - min_val) / range_val if range_val > 0 else 0
        norm_std = std / range_val if range_val > 0 else 0

        filtered_stats[col] = {
            "mean": float(mean),
            "std": float(std),
            "min": float(min_val),
            "max": float(max_val),
            "normMean": float(norm_mean),
            "normStd": float(norm_std),
            "isNumeric": True,
        }

    # Get the original data (needed to reconstruct complete points)
    original_data = await get_file_data(filename)
    id_to_original = {item["id"]: item for item in original_data["data"]}

    # Create the projection result
    matched_data = []
    for i, point_id in enumerate(dataset_info.ids):
        if i < len(projected_data) and point_id in id_to_original:
            matched_data.append(
                {
                    "id": point_id,
                    "pos": {
                        "x": float(projected_data[i][0]),
                        "y": float(projected_data[i][1]),
                    },
                    "original": id_to_original[point_id],
                }
            )

    # Get category values for non-numeric attributes (same as original)
    category_values = {}
    for col in dataset_info.non_numeric_cols:
        unique_vals = dataset_info.df[col].unique()
        category_values[col] = [str(val) for val in unique_vals]

    # Load attribute metadata if available
    attribute_metadata = load_attribute_metadata(filename)

    # Construct final result
    result = {
        "projectionData": matched_data,
        "globalStats": filtered_stats,
        "nonNumericAttributes": dataset_info.non_numeric_cols,
        "categoryValues": category_values,
        "numericAttributes": valid_attributes,
        "filteredAttributes": True,
    }

    if attribute_metadata:
        result["attributeMetadata"] = attribute_metadata

    return result


# Run the server using:
# uvicorn script_name:app --reload
# uvicorn backend.mock_server:app --reload
