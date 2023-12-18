import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mangum import Mangum
from starlette.middleware.sessions import SessionMiddleware


from backend.plant_api.routers import auth, new_plants, plants
from backend.plant_api.constants import get_jwt_secret


app = FastAPI()


origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://master.d1g3nlvs6mpirt.amplifyapp.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(plants.router)
# New endpoints
app.include_router(new_plants.router)


@app.get("/")
def root():
    return {"message": "Hello World"}


@app.get("/test")
def test():
    return {"message": "I'm working"}


handler = Mangum(app)

# For debugging, run this instead of from console
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
