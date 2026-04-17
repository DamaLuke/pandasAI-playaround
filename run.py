#!/usr/bin/env python3
"""
项目启动脚本

用法:
    python run.py          # 启动服务
    python run.py --dev    # 开发模式（带热重载）
"""
import sys
from pathlib import Path

# 将项目根目录添加到 Python 路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# 现在可以导入 backend
from backend.main import app
from backend.config import get_settings

def main():
    """项目启动入口"""
    import uvicorn

    settings = get_settings()

    # 检查是否有 --dev 参数
    debug = "--dev" in sys.argv or settings.debug

    print(f"🚀 启动 PandasAI Backend API...")
    print(f"   环境: {'development' if debug else 'production'}")
    print(f"   地址: http://{settings.host}:{settings.port}")
    print(f"   文档: http://{settings.host}:{settings.port}/docs")
    print(f"open http://localhost:{settings.port}")

    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=debug,
        workers=1 if debug else settings.workers,
    )


if __name__ == "__main__":
    main()
