import pickle
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))

MODEL_PATH = os.path.join(BASE_DIR, "model", "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "model", "vectorizer.pkl")

print("Model path:", MODEL_PATH)
print("Vectorizer path:", VECTORIZER_PATH)

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

with open(VECTORIZER_PATH, "rb") as f:
    vectorizer = pickle.load(f)


def predict_review(text):
    vec = vectorizer.transform([text])
    prob = model.predict_proba(vec)[0]

    fake = round(prob[0] * 100, 2)
    genuine = round(prob[1] * 100, 2)
    confidence = round(max(prob) * 100, 2)

    return {
        "fake_percentage": fake,
        "genuine_percentage": genuine,
        "confidence": confidence,
        "prediction": "Fake" if fake > genuine else "Genuine"
    }