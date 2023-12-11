import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mangum import Mangum
from starlette.middleware.sessions import SessionMiddleware


from backend.routers import auth, plants
from backend.routers.auth import JWT_SECRET_KEY


app = FastAPI()

app.include_router(auth.router)
app.include_router(plants.router)

# TODO: change/handle this in production
origins = ["http://localhost", "http://localhost:3000", "localhost:3000", "localhost", "http://localhost:3000/"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
