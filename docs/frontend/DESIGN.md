# 前端设计文档

> **文档状态**：📝 已更新至当前代码版本（2026-04-08）

## 📐 页面布局

### 整体布局（Desktop）

```
┌────────────────────────────────────────────────────────────────────┐
│  Header: Logo + 项目名称 + 导航链接                                  │
├──────────────┬─────────────────────────────────────────────────────┤
│              │                                                      │
│  侧边栏      │              主内容区（对话面板）                     │
│  (380px)     │                                                      │
│              │  ┌───────────────────────────────────────────────┐  │
│  ┌────────┐  │  │  对话区域                                       │  │
│  │📤 上传 │  │  │  - 系统消息（居中）                              │  │
│  │   数据 │  │  │  - 用户消息（右侧，蓝色气泡）                    │  │
│  │   文件│  │  │  - AI 回复（左侧，灰色气泡）                    │  │
│  ├────────┤  │  │  - 图表/表格结果                                │  │
│  │📋 数据 │  │  │                                               │  │
│  │   预览 │  │  └───────────────────────────────────────────────┘  │
│  │   (多 │  │  ┌───────────────────────────────────────────────┐  │
│  │   Sheet│  │  │  输入区域                                       │  │
│  │   选择)│  │  │  [textarea]              [快捷按钮]  [发送]   │  │
│  └────────┘  │  └───────────────────────────────────────────────┘  │
├──────────────┴─────────────────────────────────────────────────────┤
│  Footer: Powered by PandasAI                                        │
└────────────────────────────────────────────────────────────────────┘
```

### 响应式布局（Mobile）

```
┌────────────────────┐
│ Header             │
├────────────────────┤
│ 侧边栏（折叠在下方）│
│ ┌────────────────┐ │
│ │ 📤 上传区域     │ │
│ │ 📋 数据预览     │ │
│ └────────────────┘ │
├────────────────────┤
│                    │
│  对话面板           │
│  (全宽显示)        │
│                    │
├────────────────────┤
│ Footer             │
└────────────────────┘

注：当前版本采用垂直堆叠布局，非 Tab 切换模式
```

---

## 🎨 配色方案

### 当前主题（仅亮色主题）

```css
:root {
  /* 主色 */
  --primary-color: #2563eb;      /* 蓝色 - 主要按钮、链接 */
  --primary-hover: #1d4ed8;
  
  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --bg-tertiary: #e5e7eb;
  
  /* 文字色 */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  
  /* 边框 */
  --border-color: #d1d5db;
  
  /* 阴影 */
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  /* 圆角 */
  --radius: 8px;
  --radius-lg: 12px;
  
  /* 功能色 */
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}
```

### 消息气泡样式

| 类型 | 背景色 | 文字色 | 对齐 |
|------|--------|--------|------|
| 用户消息 | `--primary-color` (#2563eb) | 白色 | 右对齐 |
| AI 消息 | `--bg-secondary` (#f3f4f6) | `--text-primary` | 左对齐 |
| 系统消息 | `rgba(245, 158, 11, 0.1)` | 默认 | 居中 |

> **注意**：暗色主题尚未实现

---

## 🔧 组件设计

### 1. 上传区域 (UploadSection)

```
┌─────────────────────────────────┐
│ 📤 上传数据文件                  │
├─────────────────────────────────┤
│                                 │
│         ⬆️                      │
│    点击或拖拽文件到此处          │
│    支持 .xlsx, .xls, .csv 格式  │
│                                 │
├─────────────────────────────────┤
│ ✅ clinical_data.xlsx 上传成功！│
└─────────────────────────────────┘
```

**功能说明**：
- 文件拖拽上传区域
- 点击选择文件
- 文件验证（格式、大小限制 10MB）
- 上传状态视觉反馈

> **说明**：LLM 配置（API Token、Model、Base URL）通过后端 `.env` 文件管理，无需在页面上配置。

### 2. 数据预览 (DataPreview)

```
┌─────────────────────────────────┐
│ 📋 数据预览                      │
├─────────────────────────────────┤
│ 选择工作表（可多选）：   [全选] │
│ ☑ Sheet1                       │
│ ☐ Sheet2                       │
│ ☐ Data                         │
├─────────────────────────────────┤
│ 预览 (前 10 行):               │
│ ┌───────┬─────┬──────┬───────┐ │
│ │ 姓名  │ 年龄 │ 部门 │ 销售额 │ │
│ ├───────┼─────┼──────┼───────┤ │
│ │ 张三  │ 28   │ 销售 │ 150000│ │
│ │ 李四  │ 32   │ 技术 │ 180000│ │
│ │ 王五  │ 25   │ 市场 │ 120000│ │
│ │ ...   │ ...  │ ...  │ ...   │ │
│ └───────┴─────┴──────┴───────┘ │
│ Rows: 1-10 of 156              │
└─────────────────────────────────┘
```

**功能说明**：
- 工作表多选器（复选框列表 + 全选/取消全选按钮）
- DataTables 表格展示
- 支持分页（每页10条）、水平滚动
- 首个工作表默认选中

### 3. 对话面板 (ChatPanel)

```
┌─────────────────────────────────────────────────────────────────┐
│ 💬 智能对话                        [未连接 / 已连接]             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │  👋 欢迎使用 ChatExcel！                 │ ← 系统消息（居中）│
│  │  请先上传数据文件，然后向我提问...       │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│                           ┌─────────────────────────────────┐   │
│                           │ 📋 查看数据概况            │   │ ← 用户消息│
│                           └─────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │ 🤖                                       │                    │
│  │ 以下是数据概况：                         │ ← AI 消息        │
│  │ 总行数：1000，列数：15                   │                    │
│  │ [图表/表格显示区域]                      │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [输入你的问题...                    ]  [📊] [📈] [🔢] [发送]   │
└─────────────────────────────────────────────────────────────────┘
```

**功能说明**：
- **消息类型**：系统消息（居中黄色）、用户消息（右侧蓝色）、AI 消息（左侧灰色）
- **快捷按钮**：数据概况 📊、生成图表 📈、统计分析 🔢
- **结果渲染**：支持 ECharts 图表、DataTables 表格、纯文本
- **会话状态**：顶部显示连接状态（未连接/已连接）

### 4. 加载状态

```
┌─────────────────────────────────┐
│      ┌──────┐                   │
│      │ 旋转  │                   │
│      │ 动画  │                   │
│      └──────┘                   │
│    正在创建会话并上传文件...      │
│         AI 正在思考...          │
└─────────────────────────────────┘
```

**说明**：使用全局遮罩层显示加载状态，非流式输出

---

## 📝 组件状态

### 按钮状态

| 状态 | 样式 |
|------|------|
| Default | `--primary-color` 背景，白色文字 |
| Hover | `--primary-hover` 背景 |
| Disabled | `opacity: 0.5`，禁止光标 |

### 发送按钮
- 会话未建立或输入为空时禁用
- 悬停时背景色加深

### 输入框状态

| 状态 | 样式 |
|------|------|
| Default | `--border-color` 边框 |
| Focus | `--primary-color` 边框，无阴影 |
| Disabled | 未实现 |

### 消息气泡状态

| 类型 | 样式 | 位置 |
|------|------|------|
| 用户消息 | `--primary-color` 背景，白色文字 | `align-self: flex-end` |
| AI 消息 | `--bg-secondary` 背景 | `align-self: flex-start` |
| 系统消息 | `rgba(245, 158, 11, 0.1)` 背景，橙色边框 | `align-self: center` |

---

## 🔌 前端文件结构

### 实际文件结构

```
frontend/
├── index.html              # 单页应用入口（HTML + 内联结构）
├── css/
│   └── style.css           # 所有样式（变量、布局、组件）
└── js/
    └── app.js              # 完整应用逻辑（模块化代码，单一文件）
```

### 代码组织方式

虽然文件物理上是扁平结构，但 `app.js` 内部采用模块化组织：

```javascript
// ===== 配置 =====
const CONFIG = { ... };

// ===== 状态管理 =====
const state = { ... };

// ===== DOM 元素 =====
const elements = { ... };

// ===== API 封装 =====
const api = { ... };

// ===== 工具函数 =====
const utils = { ... };

// ===== UI 更新 =====
const ui = { ... };

// ===== 事件处理 =====
const handlers = { ... };

// ===== 初始化 =====
function init() { ... }
```

### 外部依赖

| 库 | 用途 | CDN |
|----|------|-----|
| **ECharts 5.4.3** | 图表渲染 | `cdn.jsdelivr.net` |
| **DataTables 1.13.7** | 表格展示 | `cdn.datatables.net` |
| **jQuery 3.7.1** | DataTables 依赖 | `code.jquery.com` |

---

## 📡 前端 API 调用

### 普通 REST API 请求

当前实现使用普通 REST API，非 SSE 流式。请求/响应模式如下：

```javascript
// API 配置
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000/api/v1',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['.xlsx', '.xls', '.csv'],
};

// API 封装
const api = {
    // 创建新会话
    async createSession() {
        const response = await fetch(`${CONFIG.API_BASE_URL}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    },

    // 上传文件
    async uploadFile(file, sessionId) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/upload?session_id=${sessionId}`, 
            { method: 'POST', body: formData }
        );
        return response.json();
    },

    // 发送消息
    async chat(sessionId, question, sheet = null) {
        const body = { question };
        if (sheet) body.sheet = sheet;
        
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/chat?session_id=${sessionId}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        );
        return response.json();
    },

    // 获取数据预览
    async previewData(sessionId, sheetName = null, page = 1, pageSize = 20) {
        const params = new URLSearchParams({ page, page_size: pageSize });
        if (sheetName) params.append('sheet', sheetName);
        
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/data?${params.toString()}&session_id=${sessionId}`
        );
        return response.json();
    },

    // 获取对话历史
    async getChatHistory(sessionId, limit = null) {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit);
        const queryString = params.toString() ? `?${params}` : '';
        
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/chat/history${queryString}&session_id=${sessionId}`
        );
        return response.json();
    }
};
```

### 加载遮罩处理

由于使用普通 REST API 而非 SSE 流式，使用全局加载遮罩指示处理状态：

```javascript
// 加载状态管理
const utils = {
    setLoading(show, text = '正在处理...') {
        state.isLoading = show;
        elements.loadingOverlay.querySelector('p').textContent = text;
        elements.loadingOverlay.classList.toggle('hidden', !show);
    }
};

// 使用示例 - 发送消息
async function handleSendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message || !state.sessionId) return;
    
    // 添加用户消息
    ui.addMessage(message, 'user');
    elements.messageInput.value = '';
    
    // 显示加载遮罩
    utils.setLoading(true, 'AI 正在思考...');
    
    try {
        const selectedSheets = state.currentSheets.join(',');
        const response = await api.chat(state.sessionId, message, selectedSheets);
        
        // 根据响应类型显示结果
        if (response.type === 'chart' && response.content) {
            const msgDiv = ui.addMessage({ type: 'chart' });
            const chartId = `chart-${Date.now()}`;
            msgDiv.querySelector('.chart-container').id = chartId;
            ui.renderChart(chartId, response.content);
        } else {
            ui.addMessage(response.answer || response.content, 'assistant');
        }
    } catch (error) {
        ui.addMessage(`❌ 请求失败: ${error.message}`, 'system');
    } finally {
        // 隐藏加载遮罩
        utils.setLoading(false);
    }
}
```

### API 响应类型

| 响应类型 | 数据结构 | 说明 |
|----------|----------|------|
| `answer` | `{ "answer": "文本内容" }` | 普通文本回复 |
| `chart` | `{ "type": "chart", "content": { ECharts配置 } }` | ECharts 图表配置 |
| `dataframe` | `{ "type": "dataframe", "content": [...] }` | 表格数据 |
| `error` | `{ "detail": "错误信息" }` | 错误信息 |

---

## 📱 移动端适配

### 断点设置

```css
/* 移动端优先 */
@media (min-width: 768px) {
  /* 平板及以上 - 显示侧边栏 */
  .sidebar { display: flex; }
  .main-content { margin-left: 280px; }
}

@media (max-width: 767px) {
  /* 移动端 - 底部 Tab 导航 */
  .sidebar { display: none; }
  .mobile-tabs { display: flex; }
}
```

### 手势支持

- 左右滑动切换配置/对话面板
- 下拉刷新（移动端）
- 长按复制结果
