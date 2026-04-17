"""
响应模型定义
"""

from typing import Any, Generic, Literal, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class Response(BaseModel, Generic[T]):
    """
    统一响应格式（泛型）
    
    所有 API 响应都遵循此格式
    """
    code: int = Field(default=200, description="状态码，200 表示成功")
    message: str = Field(default="success", description="响应消息")
    data: Optional[T] = Field(default=None, description="响应数据")


class StatusData(BaseModel):
    """状态数据"""
    status: str = Field(..., description="服务状态: ready/error")
    version: str = Field(default="1.0.0", description="API 版本")


class StatusResponse(Response[StatusData]):
    """状态检查响应"""
    pass


class UploadData(BaseModel):
    """上传响应数据"""
    session_id: str = Field(..., description="上传成功后的会话ID")
    file_name: str = Field(..., description="文件名")
    file_size: int = Field(..., description="文件大小(字节)")


class UploadResponse(Response[UploadData]):
    """文件上传响应"""
    pass


class SheetsData(BaseModel):
    """工作表列表数据"""
    sheets: list[str] = Field(default=[], description="可用工作表名称列表")
    current_sheet: Optional[str] = Field(default=None, description="当前活跃工作表")


class SheetsResponse(Response[SheetsData]):
    """工作表列表响应"""
    pass


class ChatMessage(BaseModel):
    """
    聊天消息结构（用于流式响应的结束标记）
    """
    role: Literal["user", "assistant"] = Field(..., description="消息角色")
    content: str = Field(..., description="消息内容")


class ChatData(BaseModel):
    """聊天响应数据"""
    message: ChatMessage = Field(..., description="AI 回复消息")


class ChatResponse(Response[ChatData]):
    """非流式聊天响应（备用）"""
    pass


class ChatStreamChunk(BaseModel):
    """
    流式响应数据块 (SSE)
    
    格式: event: message\ndata: {...}\n\n
    """
    event: Literal["message", "error", "done"] = Field(..., description="事件类型")
    data: dict[str, Any] = Field(default_factory=dict, description="事件数据")


class ErrorResponse(Response[None]):
    """错误响应"""
    code: int = Field(default=400, description="错误状态码")
    message: str = Field(default="error", description="错误消息")
    data: None = Field(default=None)
