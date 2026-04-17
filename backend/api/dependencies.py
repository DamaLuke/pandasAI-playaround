"""API 依赖注入模块

提供 FastAPI 依赖函数，用于注入服务实例
"""

from functools import lru_cache
from fastapi import Request, HTTPException, status
from typing import Annotated
from fastapi import Depends

from backend.services import SessionManager, DataManager
from backend.config import settings


# 全局服务实例（单例模式）
_session_manager: SessionManager | None = None
_data_manager: DataManager | None = None


def init_services():
    """初始化全局服务实例"""
    global _session_manager, _data_manager
    
    if _session_manager is None:
        _session_manager = SessionManager()
    
    if _data_manager is None:
        _data_manager = DataManager(
            upload_dir=settings.UPLOAD_DIR,
            max_file_size_mb=settings.MAX_UPLOAD_SIZE_MB
        )


def get_session_manager() -> SessionManager:
    """获取 SessionManager 实例（依赖注入）"""
    if _session_manager is None:
        init_services()
    return _session_manager


def get_data_manager() -> DataManager:
    """获取 DataManager 实例（依赖注入）"""
    if _data_manager is None:
        init_services()
    return _data_manager


# FastAPI 依赖类型
SessionManagerDep = Annotated[SessionManager, Depends(get_session_manager)]
DataManagerDep = Annotated[DataManager, Depends(get_data_manager)]


async def get_session_id(request: Request) -> str:
    """从请求头或查询参数中获取 session_id
    
    Headers: X-Session-ID
    Query: session_id
    
    Raises:
        HTTPException: 当 session_id 未提供时
    """
    # 优先从 Header 获取
    session_id = request.headers.get("X-Session-ID")
    
    # 其次从查询参数获取
    if not session_id:
        session_id = request.query_params.get("session_id")
    
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="缺少会话ID，请通过 X-Session-ID Header 或 session_id 查询参数提供"
        )
    
    return session_id


async def validate_session(
    session_id: Annotated[str, Depends(get_session_id)],
    session_manager: SessionManagerDep
) -> str:
    """验证 session_id 是否有效
    
    Returns:
        str: 验证通过的 session_id
        
    Raises:
        HTTPException: 当会话不存在或已过期时
    """
    session = session_manager.get_session(session_id)
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"会话不存在或已过期: {session_id}"
        )
    
    return session_id


# FastAPI 依赖类型
SessionIdDep = Annotated[str, Depends(get_session_id)]
ValidSessionDep = Annotated[str, Depends(validate_session)]
