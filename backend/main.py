from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, worker, admin

app = FastAPI(title="SurelyAI Gig Worker Insurance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(worker.router, prefix="/api/v1/workers", tags=["workers"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "SurelyAI Gig Worker Insurance API is running."}
