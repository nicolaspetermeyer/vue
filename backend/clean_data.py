import pandas as pd
import os

DATA_DIR = "./data"

df = pd.read_csv("./backend/data/Voting-Data.csv")
target = df.columns[4:]

mean = df[target].mean()


df[target] = df[target].fillna(mean)
print(df[target].isnull().sum())

df.to_csv("Voting-data-cleaned.csv", index=False)

# print(os.listdir())
