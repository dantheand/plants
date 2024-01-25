import logging

from plant_api.constants import AWS_DEPLOYMENT_ENV
from plant_api.routers.common import BaseRouter
from starlette.requests import Request
from fastapi import Response

from plant_api.utils.deployment import get_deployment_env

LOGGER = logging.getLogger(__name__)

TEST_COOKIE_KEY = "test_cookie"


router = BaseRouter(
    prefix="/testing",
)


@router.get("/set_cookie")
async def set_cookie_test(request: Request, response: Response):
    response.set_cookie(
        key=TEST_COOKIE_KEY,
        value="test_value",
        httponly=True,
        path="/",
        secure=True if get_deployment_env() == AWS_DEPLOYMENT_ENV else False,
        samesite="lax",
    )
    return {"message": "I'm working"}


@router.get("/get_cookie")
async def get_cookie_test(request: Request):
    return {"message": request.cookies.get(TEST_COOKIE_KEY)}
