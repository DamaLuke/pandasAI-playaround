"""
请求模型定义
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """
    聊天请求模型
    
    POST /api/v1/chat
    注意：session_id 通过 URL 查询参数传递，不需要在请求体中包含
    """
    question: str = Field(..., description="用户输入的问题（分析请求）")
    sheet: Optional[str] = Field(default=None, description="指定要分析的工作表名称（Excel专用）")
    stream: bool = Field(default=False, description="是否启用流式响应 (SSE)")


class UploadRequest(BaseModel):
    """
    文件上传请求模型（用于表单验证）
    
    POST /api/upload
    注意：实际文件通过 multipart/form-data 上传
    此模型用于其他元数据验证
    """
    # 文件上传通过 FastAPI UploadFile 处理
    # 此模型用于未来扩展，如上传选项等
    pass
