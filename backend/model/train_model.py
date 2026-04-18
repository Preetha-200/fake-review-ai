import pandas as pd
import pickle
import os

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Path handling (important)
BASE_DIR = os.path.dirname(__file__)
data_path = os.path.join(BASE_DIR, "fake_reviews_dataset.csv")

# Load dataset
df = pd.read_csv(data_path)

# Convert labels
df['label'] = df['label'].map({'CG': 0, 'OR': 1})

# Features and target
X = df['text_']
y = df['label']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Vectorization
vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Model training
model = LogisticRegression(max_iter=1000)
model.fit(X_train_vec, y_train)

# ✅ ADD THIS PART HERE
from sklearn.metrics import accuracy_score

y_pred = model.predict(X_test_vec)
print("Accuracy:", accuracy_score(y_test, y_pred))

# Save model
pickle.dump(model, open(os.path.join(BASE_DIR, "model.pkl"), "wb"))
pickle.dump(vectorizer, open(os.path.join(BASE_DIR, "vectorizer.pkl"), "wb"))

print("✅ Model trained successfully!")