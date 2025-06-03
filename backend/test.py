import umap

import matplotlib.pyplot as plt

from sklearn.datasets import load_iris


data = load_iris()
X, y = data.data, data.target

reducer = umap.UMAP(verbose=0, random_state=0)
embedding = reducer.fit_transform(X)
plt.scatter(embedding[:, 0], embedding[:, 1], c=y)
