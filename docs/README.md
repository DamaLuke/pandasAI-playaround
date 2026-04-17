# 临床数据智能分析平台 - 界面化设计方案

## 📋 文档目录

- [架构总览](./ARCHITECTURE.md) - 系统整体架构与技术选型
- [前端设计](./frontend/DESIGN.md) - 前端页面布局与交互设计
- [后端 API](./backend/API.md) - FastAPI 接口设计
- [工作流程](./WORKFLOW.md) - 核心功能工作流程

---

## 🎯 快速概览

| 项目 | 技术方案 |
|------|----------|
| **后端框架** | FastAPI |
| **前端** | 原生 HTML + CSS + JS（单页面应用） |
| **流式输出** | Server-Sent Events (SSE) |
| **图表渲染** | ECharts |
| **表格组件** | DataTables |

---

## 📁 项目目录结构

```
pandasai-playaround/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # .env 配置管理
│   ├── data_manager.py      # Excel/数据加载管理
│   ├── pandasai_service.py  # PandasAI 核心逻辑封装
│   └── requirements.txt     # 后端依赖
├── frontend/
│   ├── index.html           # 单页应用主入口
│   ├── css/
│   │   └── style.css        # 样式文件
│   └── js/
│       ├── app.js           # 主应用逻辑
│       ├── chat.js          # 对话与查询逻辑
│       └── renderer.js      # 结果渲染（表格/图表/文本）
├── docs/                    # 设计文档
│   ├── README.md            # 本文档
│   ├── ARCHITECTURE.md      # 架构总览
│   ├── frontend/
│   │   └── DESIGN.md        # 前端设计
│   ├── backend/
│   │   └── API.md           # 后端 API 设计
│   └── WORKFLOW.md          # 工作流程
├── .env                     # 环境变量（API Token 等敏感信息）
├── .env.example             # 环境变量示例（可提交到 Git）
├── main.py                  # 保留原脚本
└── pyproject.toml
```

---

## 🚀 实施阶段

### Phase 1: 基础骨架（MVP）
- [ ] 搭建 FastAPI 后端
- [ ] 创建前端单页框架
- [ ] 实现"输入问题 → 显示结果"基本闭环

### Phase 2: 数据管理增强
- [ ] Excel 文件上传
- [ ] Sheet 选择器与字段预览

### Phase 3: 体验优化
- [ ] 流式输出（SSE）
- [ ] 表格排序/搜索/分页
- [ ] 图表结果渲染（ECharts）
- [ ] 结果导出功能

### Phase 4: 锦上添花
- [ ] 暗色主题切换
- [ ] 查询示例/快捷提示
- [ ] 会话历史记录

---

## ⚙️ 配置说明

LLM 配置通过 `.env` 文件管理（**不**在页面上配置）：

```bash
# backend/.env 示例
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
DASHSCOPE_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=deepseek-v3
```

> **注意**：`.env` 文件已加入 `.gitignore`，不会上传到 GitHub。
> 敏感信息（API Key）仅存储在本地。
