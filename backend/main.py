# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.query import router as query_router
import uvicorn

app = FastAPI(
    title="Business Intelligence System API",
    description="AI-powered BI system with anomaly detection, forecasting, and churn prediction",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(query_router, prefix="/api/query", tags=["Query"])

@app.get("/")
def root():
    return {"message": "Business Intelligence System API is running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
