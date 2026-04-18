import pickle
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model", "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "model", "vectorizer.pkl")

model = pickle.load(open(MODEL_PATH, "rb"))
vectorizer = pickle.load(open(VECTORIZER_PATH, "rb"))

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