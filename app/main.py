from fastapi import FastAPI
from app.models.create_db import create_db_and_tables

# enable cors
from fastapi.middleware.cors import CORSMiddleware

# allow all origins for development purposes
origins = ["*"]


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    print("Startup complete.")


@app.get("/")
def read_root():
    return {"Hello": "World"}


# Include user manager routes
from app.routes import userManager
from app.routes import dashboardManager
from app.routes import navigationManager

app.include_router(userManager.router)

# Include product manager routes
from app.routes import productManager

app.include_router(productManager.router)

# Include warehouse manager routes
from app.routes import warehouseManager

app.include_router(warehouseManager.router)
app.include_router(dashboardManager.router)
app.include_router(navigationManager.router)
