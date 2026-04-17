"""
会话管理模块

管理用户会话状态，包括：
- 会话创建与销毁
- 对话历史记录
- 当前数据文件关联
"""

import uuid
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class Session:
    """会话数据"""
    id: str
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    history: list[dict] = field(default_factory=list)


class SessionManager:
    """
    会话管理器
    
    负责管理用户会话生命周期，存储会话相关的数据和对话历史。
    当前使用内存存储，生产环境可替换为 Redis 等持久化方案。
    """
    
    def __init__(self):
        # 内存中的会话存储 {session_id: Session}
        self._sessions: dict[str, Session] = {}
    
    def create_session(self) -> str:
        """
        创建新会话
        
        Returns:
            新生成的会话ID
        """
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = Session(id=session_id)
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Session]:
        """
        获取会话信息
        
        Args:
            session_id: 会话ID
            
        Returns:
            会话对象，不存在则返回 None
        """
        return self._sessions.get(session_id)
    
    def delete_session(self, session_id: str) -> bool:
        """
        删除会话
        
        Args:
            session_id: 会话ID
            
        Returns:
            是否删除成功
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False
    
    def bind_file(self, session_id: str, file_path: str, file_name: str) -> bool:
        """
        绑定文件到会话
        
        Args:
            session_id: 会话ID
            file_path: 文件存储路径
            file_name: 原始文件名
            
        Returns:
            是否绑定成功
        """
        session = self._sessions.get(session_id)
        if not session:
            return False
        
        session.file_path = file_path
        session.file_name = file_name
        return True
    
    def get_file_path(self, session_id: str) -> Optional[str]:
        """
        获取会话绑定的文件路径
        
        Args:
            session_id: 会话ID
            
        Returns:
            文件路径，未绑定则返回 None
        """
        session = self._sessions.get(session_id)
        return session.file_path if session else None
    
    def add_message(self, session_id: str, role: str, content: str) -> bool:
        """
        添加对话消息到历史记录
        
        Args:
            session_id: 会话ID
            role: 消息角色 (user/assistant)
            content: 消息内容
            
        Returns:
            是否添加成功
        """
        session = self._sessions.get(session_id)
        if not session:
            return False
        
        session.history.append({
            "role": role,
            "content": content
        })
        return True
    
    def get_history(self, session_id: str, limit: Optional[int] = None) -> list[dict]:
        """
        获取对话历史
        
        Args:
            session_id: 会话ID
            limit: 限制返回消息数量（最新的N条）
            
        Returns:
            对话历史列表
        """
        session = self._sessions.get(session_id)
        if not session:
            return []
        
        history = session.history
        if limit and len(history) > limit:
            history = history[-limit:]
        
        return history
    
    def clear_history(self, session_id: str) -> bool:
        """
        清空对话历史
        
        Args:
            session_id: 会话ID
            
        Returns:
            是否清空成功
        """
        session = self._sessions.get(session_id)
        if not session:
            return False
        
        session.history.clear()
        return True
    
    def session_exists(self, session_id: str) -> bool:
        """
        检查会话是否存在
        
        Args:
            session_id: 会话ID
            
        Returns:
            是否存在
        """
        return session_id in self._sessions


# 全局会话管理器实例
session_manager = SessionManager()
