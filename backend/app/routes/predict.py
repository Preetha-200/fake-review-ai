from fastapi import APIRouter
from app.services.predictor import predict_review

router = APIRouter()

@router.post("/predict")
def predict(data: dict):
    return predict_review(data["review"])