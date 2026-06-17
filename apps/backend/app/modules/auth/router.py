from fastapi import APIRouter

from app.core.config import settings
from app.core.enums import Role
from app.modules.auth.schemas import DevUser

router = APIRouter(tags=["Dev Auth"])


@router.get("/me", response_model=DevUser, summary="Get development user")
def get_me() -> DevUser:
    return DevUser(
        id=settings.dev_user_id,
        name=settings.dev_user_name,
        roles=[
            Role.PROJECT_ADMIN,
            Role.ONTOLOGY_MANAGER,
            Role.DATA_MANAGER,
            Role.VIEWER,
        ],
    )
