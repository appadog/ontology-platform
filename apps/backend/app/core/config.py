from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    app_name: str = "Ontology Platform Backend"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://ontology:ontology@localhost:5432/ontology_platform"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
    dev_user_id: str = "dev-user"
    dev_user_name: str = "Local Dev User"
    redis_url: str = "redis://localhost:6379/0"
    minio_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "ontology"
    minio_secret_key: str = "ontology-password"
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "ontology-password"
    llm_provider: str = "mock"
    llm_api_key: str = ""
    local_storage_path: str = ".local/storage"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
