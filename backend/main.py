import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mangum import Mangum
from fastapi.requests import Request

from backend.utils.constants import PLANTS_TABLE_NAME
from backend.utils.dynamodb import get_plant_by_id, scan_table


app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Hello World"}


@app.get("/plants")
def get_all_plants(request: Request):
    plants = scan_table(PLANTS_TABLE_NAME)
    return {"message": plants}


@app.get("/plants/{plant_id}")
def get_plant(request: Request, plant_id: str):
    plant = get_plant_by_id(plant_id)
    return {"message": plant}


handler = Mangum(app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
