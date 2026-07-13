from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import ApiError, ApiErrorResponse, ApiException, api_exception_handler


async def connector_validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> Response:
    # A malformed connector import-preview body maps to 400 INVALID_CONNECTOR_CONFIG
    # (contract-specific). Every other route keeps FastAPI's default 422 behavior.
    if request.url.path.endswith("/import-preview"):
        return JSONResponse(
            status_code=400,
            content=ApiErrorResponse(
                error=ApiError(
                    code="INVALID_CONNECTOR_CONFIG",
                    message="The connector import-preview request body is malformed.",
                    details={"error_count": len(exc.errors())},
                )
            ).model_dump(mode="json"),
        )
    # An invalid MVP6.11 ontology-pack apply-preview body (item_cap out of [1,50],
    # non-integer, or malformed JSON) maps to 400 INVALID_REQUEST_BODY (G9).
    if request.url.path.endswith("/apply-preview"):
        return JSONResponse(
            status_code=400,
            content=ApiErrorResponse(
                error=ApiError(
                    code="INVALID_REQUEST_BODY",
                    message="The ontology-pack apply-preview request body is malformed.",
                    details={"error_count": len(exc.errors())},
                )
            ).model_dump(mode="json"),
        )
    return await request_validation_exception_handler(request, exc)


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str


class VersionResponse(BaseModel):
    name: str
    version: str
    api_prefix: str


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Ontology Platform MVP backend API.",
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.add_exception_handler(ApiException, api_exception_handler)
    app.add_exception_handler(
        RequestValidationError, connector_validation_exception_handler
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()


@app.get("/health", response_model=HealthResponse, tags=["Health"], summary="Backend health")
def health() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.app_name, environment=settings.app_env)


@app.get("/version", response_model=VersionResponse, tags=["Health"], summary="Backend version")
def version() -> VersionResponse:
    return VersionResponse(name=settings.app_name, version="0.1.0", api_prefix=settings.api_v1_prefix)
