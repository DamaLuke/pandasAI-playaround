"""API 路由定义

包含所有 REST API 端点
"""

from fastapi import APIRouter, HTTPException, status, UploadFile, File, Query
from fastapi.responses import JSONResponse
from typing import Optional
import pandas as pd
import uuid

from backend.models.requests import ChatRequest
from backend.models import Response, ErrorResponse
from backend.services import SessionManager, DataManager
from backend.api.dependencies import SessionManagerDep, DataManagerDep, ValidSessionDep

# 创建路由器
router = APIRouter(prefix="/api/v1")


# ==================== 会话管理路由 ====================

@router.post(
    "/sessions",
    response_model=dict,
    summary="创建新会话",
    description="创建一个新的分析会话，返回 session_id"
)
async def create_session(
    session_manager: SessionManagerDep
) -> dict:
    """创建新的分析会话"""
    session_id = session_manager.create_session()
    
    return {
        "session_id": session_id,
        "message": "会话创建成功"
    }


@router.get(
    "/sessions/{session_id}",
    response_model=dict,
    summary="获取会话信息",
    description="获取指定会话的详细信息和状态"
)
async def get_session_info(
    session_id: str,
    session_manager: SessionManagerDep
) -> dict:
    """获取会话信息"""
    session = session_manager.get_session(session_id)
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在或已过期"
        )
    
    return {
        "session_id": session_id,
        # "created_at": session["created_at"],
        # "last_active": session["last_active"],
        "file_path": session.file_path,
        "file_name": session.file_name,
        "has_data_file": session.file_path is not None,
        "message_count": len(session.history)
    }


@router.delete(
    "/sessions/{session_id}",
    summary="删除会话",
    description="删除指定的会话及其所有数据"
)
async def delete_session(
    session_id: str,
    session_manager: SessionManagerDep
) -> dict:
    """删除会话"""
    success = session_manager.delete_session(session_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )
    
    return {"message": "会话已删除", "session_id": session_id}


# ==================== 数据文件路由 ====================

@router.post(
    "/upload",
    response_model=dict,
    summary="上传数据文件",
    description="上传 Excel 或 CSV 文件，并绑定到指定会话"
)
async def upload_file(
    session_id: ValidSessionDep,
    session_manager: SessionManagerDep,
    data_manager: DataManagerDep,
    file: UploadFile = File(..., description="支持 CSV 或 Excel 文件"),
    
) -> dict:
    """上传数据文件"""
    # 保存上传的文件
    file_info = await data_manager.save_upload(session_id, file)
    
    # 绑定到会话
    session_manager.bind_file(session_id, file_info["file_path"], file_info["filename"])
    
    # 获取工作表信息（如果是 Excel）
    sheets = None
    if file_info["format"] == "excel":
        try:
            sheets = data_manager.get_sheets(file_info["file_path"])
        except Exception:
            pass  # 忽略获取工作表失败
    
    return {
        "filename": file_info["filename"],
        "format": file_info["format"],
        "file_size": file_info["file_size"],
        "file_path": file_info["file_path"],
        "sheets": sheets
    }


@router.get(
    "/sheets",
    response_model=dict,
    summary="获取工作表列表",
    description="获取已上传 Excel 文件的所有工作表名称"
)
async def list_sheets(
    session_id: ValidSessionDep,
    session_manager: SessionManagerDep,
    data_manager: DataManagerDep
) -> dict:
    """获取工作表列表"""
    session = session_manager.get_session(session_id)
    file_path = session.file_path
    
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先上传数据文件"
        )
    
    try:
        sheets = data_manager.get_sheets(file_path)
        return {"sheets": sheets}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无法读取工作表列表: {str(e)}"
        )


@router.get(
    "/data",
    response_model=dict,
    summary="获取数据",
    description="获取指定工作表或 CSV 的数据预览"
)
async def get_data(
    session_id: ValidSessionDep,
    session_manager: SessionManagerDep,
    data_manager: DataManagerDep,
    sheet: Optional[str] = Query(None, description="工作表名称（Excel 专用）"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页行数"),
) -> dict:
    """获取数据预览"""
    session = session_manager.get_session(session_id)
    file_path = session.file_path
    
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先上传数据文件"
        )
    
    try:
        df = data_manager.load_data(file_path, sheet_name=sheet)
        
        # 分页
        total_rows = len(df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        page_df = df.iloc[start_idx:end_idx]
        
        # 转换为字典列表
        data = page_df.to_dict(orient="records")
        columns = df.columns.tolist()
        
        return {
            "columns": columns,
            "data": data,
            "total_rows": total_rows,
            "page": page,
            "page_size": page_size
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"读取数据失败: {str(e)}"
        )


@router.get(
    "/data/info",
    response_model=dict,
    summary="获取数据信息",
    description="获取数据的统计信息和结构描述"
)
async def get_data_info(
    session_id: ValidSessionDep,
    session_manager: SessionManagerDep,
    data_manager: DataManagerDep,
    sheet: Optional[str] = Query(None, description="工作表名称"),
) -> dict:
    """获取数据信息"""
    session = session_manager.get_session(session_id)
    file_path = session.file_path
    
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先上传数据文件"
        )
    
    try:
        df = data_manager.load_data(file_path, sheet_name=sheet)
        info = data_manager.get_dataframe_info(df)
        
        return info
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"获取数据信息失败: {str(e)}"
        )


# ==================== 聊天/分析路由 ====================

@router.post(
    "/chat",
    response_model=dict,
    summary="发送分析请求",
    description="向 pandasAI 发送自然语言分析请求"
)
async def chat(
    session_id: ValidSessionDep,
    request: ChatRequest,
    session_manager: SessionManagerDep,
    data_manager: DataManagerDep
) -> dict:
    """处理聊天/分析请求"""
    session = session_manager.get_session(session_id)
    file_path = session.file_path
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先上传数据文件"
        )
    
    # 加载数据
    try:
        df = data_manager.load_data(file_path, sheet_name=request.sheet)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"加载数据失败: {str(e)}"
        )
    
    # TODO: 调用 pandasAI 进行分析
    # 这里暂时返回模拟响应
    response_text = f"收到分析请求: '{request.question}'\n"
    response_text += f"数据行数: {len(df)}，列数: {len(df.columns)}"
    
    # 添加消息到历史
    session_manager.add_message(session_id, "user", request.question)
    session_manager.add_message(session_id, "assistant", response_text)
    
    return {
        "answer": response_text,
        "session_id": session_id,
        "type": "text"
    }


@router.get(
    "/chat/history",
    response_model=list,
    summary="获取对话历史",
    description="获取当前会话的对话历史记录"
)
async def get_chat_history(
    session_id: ValidSessionDep,
    session_manager: SessionManagerDep,
    limit: Optional[int] = Query(None, ge=1, le=100, description="限制返回条数"),
) -> list:
    """获取对话历史"""
    history = session_manager.get_history(session_id, limit)
    return history


@router.delete(
    "/chat/history",
    response_model=dict,
    summary="清除对话历史",
    description="清除当前会话的对话历史"
)
async def clear_chat_history(
    session_id: ValidSessionDep,
    session_manager: SessionManagerDep
) -> dict:
    """清除对话历史"""
    count = session_manager.clear_history(session_id)
    
    return {
        "message": "对话历史已清除",
        "cleared_count": count
    }


# ==================== 健康检查路由 ====================

@router.get(
    "/health",
    summary="健康检查",
    description="检查 API 服务状态"
)
async def health_check() -> dict:
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": "pandasai-backend",
        "version": "1.0.0"
    }


# ==================== 错误处理 ====================
# 注意：异常处理器在主应用 app.py 中注册，不在 router 中
