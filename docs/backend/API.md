# 后端 API 设计

## 📍 基础信息

| 项目 | 值 |
|------|------|
| Base URL | `/api/v1` |
| Content-Type | `application/json` |
| 认证方式 | Session ID (Query Parameter) |

---

## 🔌 接口列表

### 1. 健康检查接口

#### GET `/api/v1/health`
获取服务健康状态

**响应：**
```json
{
  "status": "healthy",
  "service": "pandasai-backend",
  "version": "1.0.0"
}
```

---

### 2. 会话管理接口

#### POST `/api/v1/sessions`
创建新会话

**响应：**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "会话创建成功"
}
```

#### GET `/api/v1/sessions/{session_id}`
获取会话信息

**响应：**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_path": "/path/to/file.xlsx",
  "file_name": "clinical_data.xlsx",
  "has_data_file": true,
  "message_count": 3
}
```

#### DELETE `/api/v1/sessions/{session_id}`
删除指定会话

**响应：**
```json
{
  "message": "会话已删除",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 3. 文件上传接口

#### POST `/api/v1/upload`
上传 Excel 或 CSV 文件（需要 session_id 参数）

**请求：**
- Content-Type: `multipart/form-data`
- Query: `session_id` (必需)
- Body: `file` (Excel/CSV 文件)

**响应：**
```json
{
  "filename": "clinical_data.xlsx",
  "format": "excel",
  "file_size": 2458624,
  "file_path": "/uploads/xxx/clinical_data.xlsx",
  "sheets": ["LB", "AE", "CM"]
}
```

**错误响应：**
```json
{
  "detail": "请先创建会话"
}
```
或
```json
{
  "detail": "不支持的文件格式"
}
```

---

### 4. 数据接口

#### GET `/api/v1/sheets`
获取已上传 Excel 文件的所有工作表名称

**Query 参数：**
- `session_id` (必需): 会话 ID

**响应：**
```json
{
  "sheets": ["LB", "AE", "CM", "DM"]
}
```

#### GET `/api/v1/data`
获取指定工作表或 CSV 的数据预览（支持分页）

**Query 参数：**
- `session_id` (必需): 会话 ID
- `sheet` (可选): 工作表名称（Excel 专用）
- `page` (可选): 页码，默认 1
- `page_size` (可选): 每页行数，默认 20，最大 100

**响应：**
```json
{
  "columns": ["USUBJID", "VISIT", "PARAM", "LBSTRESN"],
  "data": [
    {"USUBJID": "001", "VISIT": "W1", "PARAM": "ALT", "LBSTRESN": 25.3},
    {"USUBJID": "001", "VISIT": "W1", "PARAM": "AST", "LBSTRESN": 28.1}
  ],
  "total_rows": 1234,
  "page": 1,
  "page_size": 20
}
```

#### GET `/api/v1/data/info`
获取数据的统计信息和结构描述

**Query 参数：**
- `session_id` (必需): 会话 ID
- `sheet` (可选): 工作表名称

**响应：**
```json
{
  "columns": [...],
  "dtypes": {...},
  "shape": [1000, 15],
  "memory_usage": "120KB",
  "numeric_summary": {...},
  "categorical_summary": {...}
}
```

---

### 5. 对话接口

#### POST `/api/v1/chat`
发送自然语言分析请求

**Query 参数：**
- `session_id` (必需): 会话 ID

**请求体：**
```json
{
  "question": "找出所有 ALT 异常升高的受试者",
  "sheet": "LB"
}
```

**响应：**
```json
{
  "answer": "收到分析请求: '找出所有 ALT 异常升高的受试者'\n数据行数: 1234，列数: 8",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "text"
}
```

#### GET `/api/v1/chat/history`
获取当前会话的对话历史记录

**Query 参数：**
- `session_id` (必需): 会话 ID
- `limit` (可选): 限制返回条数，最大 100

**响应：**
```json
[
  {
    "role": "user",
    "content": "找出所有 ALT 异常升高的受试者",
    "timestamp": "2026-03-26T14:30:52Z"
  },
  {
    "role": "assistant",
    "content": "分析完成！共发现 23 条记录...",
    "timestamp": "2026-03-26T14:31:05Z"
  }
]
```

#### DELETE `/api/v1/chat/history`
清除当前会话的对话历史

**Query 参数：**
- `session_id` (必需): 会话 ID

**响应：**
```json
{
  "message": "对话历史已清除",
  "cleared_count": 5
}
```

---

## 🔧 错误处理

### 错误响应格式

使用 HTTP 状态码 + FastAPI 默认错误格式：

```json
{
  "detail": "错误描述信息"
}
```

### 常见 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误（如未上传文件、缺少 session_id） |
| 404 | 会话不存在或已过期 |
| 500 | 服务器内部错误 |

### 错误场景示例

**会话不存在：**
```json
{
  "detail": "会话不存在或已过期"
}
```

**未上传文件：**
```json
{
  "detail": "请先上传数据文件"
}
```

---

## 🔒 安全配置

### CORS 配置 (FastAPI)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 后端文件结构

```
backend/
├── __init__.py
├── main.py                  # FastAPI 应用入口
├── config.py                # .env 配置管理
├── api/
│   ├── __init__.py
│   ├── routes.py            # API 路由定义
│   └── dependencies.py      # 依赖注入
├── models/
│   ├── __init__.py
│   ├── requests.py          # 请求模型 (Pydantic)
│   └── responses.py         # 响应模型
├── services/
│   ├── __init__.py
│   ├── data_manager.py      # 数据加载与管理
│   └── session_manager.py   # 会话管理
└── .env.example             # 环境变量示例
```
