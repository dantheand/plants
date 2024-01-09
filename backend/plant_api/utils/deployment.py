import os
from plant_api.constants import DEPLOYMENT_ENV_VAR, LOCAL_DEPLOYMENT_ENV


def get_deployment_env():
    return os.getenv(DEPLOYMENT_ENV_VAR, LOCAL_DEPLOYMENT_ENV)
