"""
数据管理模块

负责数据文件的加载、缓存和基础信息提取：
- 支持 Excel (.xlsx, .xls) 和 CSV 格式
- 自动检测工作表
- 数据缓存避免重复加载
"""

import os
import hashlib
from pathlib import Path
from typing import Optional, Union

import pandas as pd

from backend.config import settings


class DataManager:
    """
    数据文件管理器
    
    处理数据文件的存储、加载和缓存。
    支持 Excel 和 CSV 格式。
    """
    
    def __init__(self, upload_dir: str | None = None, max_file_size_mb: float | None = None):
        # 数据缓存 {file_path: DataFrame}
        self._cache: dict[str, pd.DataFrame] = {}
        
        # 可选的配置覆盖
        self._upload_dir = upload_dir
        self._max_file_size_mb = max_file_size_mb
        
        # 确保上传目录存在
        self._ensure_upload_dir()
    
    def _ensure_upload_dir(self) -> None:
        """确保上传目录存在"""
        upload_dir = Path(self._upload_dir or settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
    
    def _generate_file_path(self, session_id: str, filename: str) -> Path:
        """
        生成文件存储路径
        
        Args:
            session_id: 会话ID
            filename: 原始文件名
            
        Returns:
            存储路径
        """
        # 使用 session_id 作为子目录，避免文件名冲突
        safe_filename = Path(filename).name  # 去除路径
        base_dir = self._upload_dir or settings.UPLOAD_DIR
        upload_dir = Path(base_dir) / session_id[:8]
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir / safe_filename
    
    def _is_valid_extension(self, filename: str) -> bool:
        """
        检查文件扩展名是否支持
        
        Args:
            filename: 文件名
            
        Returns:
            是否支持
        """
        ext = Path(filename).suffix.lower()
        return ext in settings.ALLOWED_EXTENSIONS
    
    async def save_upload(
        self,
        session_id: str,
        upload_file
    ) -> dict:
        """
        保存上传的文件
        
        Args:
            session_id: 会话ID
            upload_file: FastAPI UploadFile 对象
            
        Returns:
            包含 filename, format, file_size, file_path 的字典
        """
        filename = upload_file.filename
        
        # 检查扩展名
        if not self._is_valid_extension(filename):
            supported = ", ".join(settings.ALLOWED_EXTENSIONS)
            raise ValueError(f"不支持的文件格式，仅支持: {supported}")
        
        # 读取内容
        content = await upload_file.read()
        
        # 检查文件大小
        max_size = (self._max_file_size_mb or settings.MAX_UPLOAD_SIZE_MB) * 1024 * 1024
        if len(content) > max_size:
            max_mb = self._max_file_size_mb or settings.MAX_UPLOAD_SIZE_MB
            raise ValueError(f"文件过大，最大支持 {max_mb:.1f}MB")
        
        try:
            # 生成存储路径
            file_path = self._generate_file_path(session_id, filename)
            
            # 保存文件
            with open(file_path, "wb") as f:
                f.write(content)
            
            # 判断文件格式
            ext = Path(filename).suffix.lower()
            file_format = "excel" if ext in [".xlsx", ".xls"] else "csv"
            
            return {
                "filename": filename,
                "format": file_format,
                "file_size": len(content),
                "file_path": str(file_path)
            }
            
        except Exception as e:
            raise ValueError(f"文件保存失败: {str(e)}")
    
    def load_data(self, file_path: str, sheet_name: Optional[str] = None) -> pd.DataFrame:
        """
        加载数据文件
        
        Args:
            file_path: 文件路径
            sheet_name: 工作表名称（Excel 用）
            
        Returns:
            DataFrame
            
        Raises:
            FileNotFoundError: 文件不存在
            ValueError: 格式不支持或读取失败
        """
        # 检查缓存
        cache_key = f"{file_path}:{sheet_name}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        ext = path.suffix.lower()
        
        try:
            if ext == ".csv":
                df = pd.read_csv(file_path)
            elif ext in [".xlsx", ".xls"]:
                if sheet_name:
                    df = pd.read_excel(file_path, sheet_name=sheet_name)
                else:
                    # 默认读取第一个工作表
                    df = pd.read_excel(file_path, sheet_name=0)
            else:
                raise ValueError(f"不支持的文件格式: {ext}")
            
            # 存入缓存
            self._cache[cache_key] = df
            return df
            
        except Exception as e:
            raise ValueError(f"文件读取失败: {str(e)}")
    
    def get_sheets(self, file_path: str) -> list[str]:
        """
        获取 Excel 文件的所有工作表名称
        
        Args:
            file_path: 文件路径
            
        Returns:
            工作表名称列表
            
        Raises:
            FileNotFoundError: 文件不存在
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        ext = path.suffix.lower()
        
        # CSV 只有一个 "sheet"
        if ext == ".csv":
            return ["data"]
        
        try:
            xl = pd.ExcelFile(file_path)
            return xl.sheet_names
        except Exception as e:
            raise ValueError(f"无法读取工作表信息: {str(e)}")
    
    def get_dataframe_info(self, df: pd.DataFrame) -> dict:
        """
        获取 DataFrame 的基础信息
        
        Args:
            df: DataFrame
            
        Returns:
            数据信息字典
        """
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "memory_usage": df.memory_usage(deep=True).sum()
        }
    
    def clear_cache(self, file_path: Optional[str] = None) -> None:
        """
        清除缓存
        
        Args:
            file_path: 指定文件路径则清除该文件缓存，否则清除所有缓存
        """
        if file_path:
            # 清除指定文件的缓存（匹配所有 sheet）
            keys_to_remove = [k for k in self._cache if k.startswith(file_path)]
            for key in keys_to_remove:
                del self._cache[key]
        else:
            self._cache.clear()
    
    def delete_file(self, file_path: str) -> bool:
        """
        删除文件及其缓存
        
        Args:
            file_path: 文件路径
            
        Returns:
            是否删除成功
        """
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
            
            # 清除缓存
            self.clear_cache(file_path)
            return True
            
        except Exception:
            return False


# 全局数据管理器实例
data_manager = DataManager()
