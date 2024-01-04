import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mangum import Mangum
from starlette.middleware.sessions import SessionMiddleware

from backend.plant_api.constants import get_jwt_secret
from backend.plant_api.routers import auth, new_plants, new_images


app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key=get_jwt_secret())


# TODO: remove localhosts in production environment
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
# New endpoints
app.include_router(new_plants.router)
app.include_router(new_images.router)


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
