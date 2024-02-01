import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mangum import Mangum
from starlette.middleware.sessions import SessionMiddleware

from plant_api.constants import AWS_DEPLOYMENT_ENV, LOCAL_DEPLOYMENT_ENV, get_jwt_secret
from plant_api.routers import auth, plants, images, users, testing, lineages
from plant_api.utils.deployment import get_deployment_env

logging.basicConfig(level=logging.INFO)


app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key=get_jwt_secret())

if get_deployment_env() == LOCAL_DEPLOYMENT_ENV:
    origins = ["http://localhost", "http://localhost:3000"]
elif get_deployment_env() == AWS_DEPLOYMENT_ENV:
    origins = [
        "https://master.d1g3nlvs6mpirt.amplifyapp.com",
        "https://www.plantapp.name",
        "https://www.plantopticon.com",
        "https://www.plantopti.com",
    ]
else:
    raise ValueError(f"Unknown deployment environment: {get_deployment_env()}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(plants.router)
app.include_router(images.router)
app.include_router(users.router)
app.include_router(lineages.router)

app.include_router(testing.router)


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
