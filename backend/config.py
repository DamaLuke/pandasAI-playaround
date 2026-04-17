"""
配置管理 - 从环境变量加载
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# 加载 .env 文件
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    """应用配置"""
    
    # 服务配置
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # LLM 配置
    API_TOKEN: str = os.getenv("API_TOKEN", "")
    API_BASE: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    MODEL: str = 'deepseek-r1'
    
    # 路径配置
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    EXPORTS_DIR: str = os.getenv("EXPORTS_DIR", "./exports")
    TEMP_DIR: str = os.getenv("TEMP_DIR", "./tmp")
    
    # 其他配置
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
    ALLOWED_EXTENSIONS: list = [".csv", ".xlsx", ".xls"]
    WORKERS: int = int(os.getenv("WORKERS", "1"))
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")
    VERBOSE: bool = os.getenv("VERBOSE", "true").lower() == "true"
    ENABLE_CACHE: bool = os.getenv("ENABLE_CACHE", "true").lower() == "true"
    
    @property
    def llm_configured(self) -> bool:
        """检查 LLM 是否已配置"""
        return bool(self.API_TOKEN)
    
    # 小写别名（用于 main.py 中的 snake_case 访问）
    @property
    def host(self) -> str:
        return self.HOST
    
    @property
    def port(self) -> int:
        return self.PORT
    
    @property
    def debug(self) -> bool:
        return self.DEBUG
    
    @property
    def api_token(self) -> str:
        return self.API_TOKEN
    
    @property
    def api_base(self) -> str:
        return self.API_BASE
    
    @property
    def model(self) -> str:
        return self.MODEL
    
    @property
    def environment(self) -> str:
        return self.ENVIRONMENT
    
    @property
    def max_upload_size_mb(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB
    
    @property
    def workers(self) -> int:
        return self.WORKERS
    
    @property
    def cors_origins(self) -> list:
        return self.CORS_ORIGINS
    
    @property
    def verbose(self) -> bool:
        return self.VERBOSE
    
    @property
    def enable_cache(self) -> bool:
        return self.ENABLE_CACHE
    
    @property
    def temp_dir(self) -> str:
        return self.TEMP_DIR


settings = Settings()


def get_settings() -> Settings:
    """获取配置实例"""
    return settings
