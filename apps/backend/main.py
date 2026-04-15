import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, worker, admin, weather

app = FastAPI(title="SurelyAI Gig Worker Insurance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(worker.router, prefix="/api/v1/workers", tags=["worker"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": "SurelyAI Gig Worker Insurance API is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
