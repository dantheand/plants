from fastapi import APIRouter


class BaseRouter(APIRouter):
    def __init__(self, **kwargs):
        default_settings = {
            "redirect_slashes": False,
            # Add other default settings here
        }
        # Override defaults with provided kwargs
        default_settings.update(kwargs)

        super().__init__(**default_settings)
