import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mangum import Mangum
from starlette.middleware.sessions import SessionMiddleware


from api.routers import auth, plants
from api.routers.auth import JWT_SECRET_KEY


app = FastAPI()

app.include_router(auth.router)
app.include_router(plants.router)

# TODO: change/handle this in production
# TODO: check if in AWS, if so, allow the front-end URL
origins = [
    "http://localhost",
    "http://localhost:3000",
    "localhost:3000",
    "localhost",
    "http://localhost:3000/",
    "https://master.d1g3nlvs6mpirt.amplifyapp.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=JWT_SECRET_KEY)


@app.get("/")
def root():
    return {"message": "Hello World"}


handler = Mangum(app)

# For debugging, run this instead of from console
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
