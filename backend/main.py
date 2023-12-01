import uvicorn
from fastapi import FastAPI
from mangum import Mangum
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request

from backend.utils.constants import PLANTS_TABLE_NAME
from backend.utils.dynamodb import get_plant_by_id, scan_table


app = FastAPI()

app.mount("/static", StaticFiles(directory="./static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/")
def root():
    return {"message": "Hello World"}


@app.get("/plants")
def get_all_plants():
    plants = scan_table(PLANTS_TABLE_NAME)
    return {"message": plants}


@app.get("/plants/{plant_id}", response_class=HTMLResponse)
def get_plant(request: Request, plant_id: str):
    plant = get_plant_by_id(plant_id)
    return templates.TemplateResponse("plant.html", {"request": request, "id": plant_id})


handler = Mangum(app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
