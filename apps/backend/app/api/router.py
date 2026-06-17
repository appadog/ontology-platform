from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.ontology.router import router as ontology_router
from app.modules.project.router import router as project_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(project_router)
api_router.include_router(ontology_router)
