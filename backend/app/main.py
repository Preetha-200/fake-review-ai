from fastapi import FastAPI
from app.routes.predict import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Fake Review Detection API",
    description="AI-powered API to detect fake vs genuine reviews",
    version="1.0.0"
)

# 🔒 Replace with your frontend URL after deployment
origins = [
    "http://localhost:5500",   # local frontend
    "http://127.0.0.1:5500",
    "https://your-frontend.onrender.com"  # update later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # 🔥 restricted instead of "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "status": "running",
        "message": "Fake Review Detection API is live 🚀"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(router)