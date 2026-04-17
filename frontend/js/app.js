/**
 * ChatExcel 前端应用
 * 基于 Vanilla JavaScript + ECharts + DataTables
 */

// ===== 配置 =====
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000/api/v1',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['.xlsx', '.xls', '.csv'],
};

// ===== 状态管理 =====
const state = {
    sessionId: null,
    fileId: null,
    sheets: [],
    currentSheets: [], // 存储多个选中的sheet名
    isLoading: false,
    messages: []
};

// ===== DOM 元素 =====
const elements = {
    // 上传相关
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    uploadStatus: document.getElementById('uploadStatus'),
    
    // 数据预览
    dataPreview: document.getElementById('dataPreview'),
    sheetSelect: document.getElementById('sheetSelect'),
    previewTable: document.getElementById('previewTable'),
    
    // 对话相关
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    sessionStatus: document.getElementById('sessionStatus'),
    
    // 快捷按钮
    quickBtns: document.querySelectorAll('.quick-btn'),
    
    // 加载遮罩
    loadingOverlay: document.getElementById('loadingOverlay')
};

// ===== API 封装 =====
const api = {
    // 创建新会话
    async createSession() {
        const response = await fetch(`${CONFIG.API_BASE_URL}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || '创建会话失败');
        }
        
        return response.json();
    },

    // 通用请求方法（自动添加session_id到查询参数）
    async request(url, options = {}, sessionId = null) {
        // 如果有session_id，添加到查询参数
        let fullUrl = `${CONFIG.API_BASE_URL}${url}`;
        if (sessionId) {
            const separator = url.includes('?') ? '&' : '?';
            fullUrl += `${separator}session_id=${sessionId}`;
        }
        
        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `请求失败: ${response.status}`);
        }
        
        return response.json();
    },

    // 上传文件（需要先创建session，然后在URL中传递session_id）
    async uploadFile(file, sessionId) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/upload?session_id=${sessionId}`, {
            method: 'POST',
            body: formData
            // 注意：FormData请求不要手动设置Content-Type
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || '上传失败');
        }
        
        return response.json();
    },

    // 获取工作表列表
    async listSheets(sessionId) {
        return this.request('/sheets', {}, sessionId);
    },

    // 发送消息
    async chat(sessionId, question, sheet = null) {
        // 注意：session_id通过URL查询参数传递，不在body中
        const body = { question };
        if (sheet) body.sheet = sheet;
        
        return this.request('/chat', {
            method: 'POST',
            body: JSON.stringify(body)
        }, sessionId);
    },

    // 获取数据预览
    async previewData(sessionId, sheetName = null, page = 1, pageSize = 20) {
        const params = new URLSearchParams({ page, page_size: pageSize });
        if (sheetName) params.append('sheet', sheetName);

        return this.request(`/data?${params.toString()}`, {}, sessionId);
    },

    // 获取对话历史
    async getChatHistory(sessionId, limit = null) {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit);
        const queryString = params.toString() ? `?${params}` : '';
        
        return this.request(`/chat/history${queryString}`, {}, sessionId);
    }
};

// ===== 工具函数 =====
const utils = {
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 检查文件类型
    isValidFileType(filename) {
        const ext = '.' + filename.split('.').pop().toLowerCase();
        return CONFIG.SUPPORTED_FORMATS.includes(ext);
    },

    // 显示/隐藏加载
    setLoading(show, text = '正在处理...') {
        state.isLoading = show;
        elements.loadingOverlay.querySelector('p').textContent = text;
        elements.loadingOverlay.classList.toggle('hidden', !show);
    },

    // 显示上传状态
    showUploadStatus(message, type = 'success') {
        elements.uploadStatus.textContent = message;
        elements.uploadStatus.className = `upload-status ${type}`;
        elements.uploadStatus.classList.remove('hidden');
        
        if (type === 'success') {
            setTimeout(() => {
                elements.uploadStatus.classList.add('hidden');
            }, 5000);
        }
    },

    // 滚动到底部
    scrollToBottom() {
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
};

// ===== UI 更新 =====
const ui = {
    // 添加消息到对话
    addMessage(content, type = 'assistant') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = type === 'user' ? '👤' : (type === 'system' ? '' : '🤖');
        
        let contentHtml = '';
        if (typeof content === 'string') {
            contentHtml = `<p>${content}</p>`;
        } else if (content.type === 'chart') {
            contentHtml = `<div class="chart-container" id="chart-${Date.now()}"></div>`;
        } else if (content.type === 'table') {
            contentHtml = `<div class="data-table">${content.html}</div>`;
        } else {
            contentHtml = `<p>${JSON.stringify(content)}</p>`;
        }
        
        messageDiv.innerHTML = avatar ? `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">${contentHtml}</div>
        ` : `<div class="message-content">${contentHtml}</div>`;
        
        elements.chatMessages.appendChild(messageDiv);
        utils.scrollToBottom();
        
        return messageDiv;
    },

    // 更新会话状态
    updateSessionStatus(connected) {
        elements.sessionStatus.textContent = connected ? '已连接' : '未连接';
        elements.sessionStatus.className = `session-status ${connected ? 'connected' : ''}`;
        elements.sendBtn.disabled = !connected || !elements.messageInput.value.trim();
    },

    // 更新 Sheet 选择器
    updateSheetSelector(sheets) {
        elements.sheetSelect.innerHTML = '';
        sheets.forEach(sheet => {
            // const option = document.createElement('option');
            const item = document.createElement('label');
            item.className = 'sheet-checkbox-item';
            const checked = sheets.indexOf(sheet) === 0 ? 'checked' : '';
            item.innerHTML = `
                <input type="checkbox" value="${sheet}" ${checked}>
                <span class="sheet-name">${sheet}</span>
            `;
            elements.sheetSelect.appendChild(item);
            state.currentSheets = sheets.length > 0 ? [sheets[0]] : [];
            // option.value = sheet;
            // option.textContent = sheet;
            // elements.sheetSelect.appendChild(option);
        });
    },

    // 初始化数据表格
    initDataTable(data) {
        // 如果已经初始化，先销毁
        if ($.fn.DataTable.isDataTable('#previewTable')) {
            $('#previewTable').DataTable().destroy();
            $('#previewTable').empty(); // 清空表格内容
        }
        
        // 后端返回格式: { columns: [...], data: [{col1: val1, ...}, ...] }
        // DataTables可以直接使用对象数组格式
        const columns = data.columns.map(col => ({ data: col, title: col }));
        
        // 初始化 DataTable
        $('#previewTable').DataTable({
            data: data.data,  // 后端已经返回对象数组格式
            columns: columns,
            pageLength: 10,
            lengthChange: false,
            searching: false,
            scrollX: true,
            autoWidth: false,
            destroy: true
        });
    },

    // 渲染图表
    renderChart(containerId, chartData) {
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return;
        
        const chart = echarts.init(chartDom);
        chart.setOption(chartData);
        
        // 响应式
        window.addEventListener('resize', () => chart.resize());
    }
};

// ===== 事件处理 =====
const handlers = {
    // 文件上传
    async handleFileUpload(file) {
        if (!file) return;
        
        // 验证
        if (!utils.isValidFileType(file.name)) {
            utils.showUploadStatus('不支持的文件格式', 'error');
            return;
        }
        
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            utils.showUploadStatus('文件大小超过限制 (10MB)', 'error');
            return;
        }
        
        utils.setLoading(true, '正在创建会话并上传文件...');
        
        try {
            // 1. 先创建会话
            const sessionResult = await api.createSession();
            state.sessionId = sessionResult.session_id;
            
            // 2. 上传文件（使用session_id）
            const uploadResult = await api.uploadFile(file, state.sessionId);
            
            state.fileId = uploadResult.file_path; // 使用file_path作为fileId
            state.sheets = uploadResult.sheets || [];
            
            // 更新 UI
            utils.showUploadStatus(`✅ ${file.name} 上传成功！`);
            ui.updateSessionStatus(true);
            ui.updateSheetSelector(state.sheets);
            
            // 显示预览区域
            elements.dataPreview.classList.remove('hidden');
            
            // 自动选择第一个 Sheet
            if (state.sheets.length > 0) {
                await this.handleSheetPreview(state.sheets[0]);
            }
            
            // 添加系统消息
            ui.addMessage(`📁 已成功加载文件：${file.name}\n📊 包含 ${state.sheets.length} 个工作表`, 'system');
            
        } catch (error) {
            utils.showUploadStatus(`❌ ${error.message}`, 'error');
            console.error('上传失败:', error);
            // 清空会话
            state.sessionId = null;
            ui.updateSessionStatus(false);
        } finally {
            utils.setLoading(false);
        }
    },

    // Sheet 选择
    // async handleSheetSelect(sheetName) {
    //     if (!state.sessionId) return;
        
    //     state.currentSheet = sheetName;
    //     utils.setLoading(true, '正在加载数据...');
        
    //     try {
    //         // 后端没有select-sheet端点，直接获取数据预览
    //         const previewData = await api.previewData(state.sessionId, sheetName, 1, 20);
    //         ui.initDataTable(previewData);
    //     } catch (error) {
    //         console.error('加载 Sheet 失败:', error);
    //         ui.addMessage(`加载失败: ${error.message}`, 'system');
    //     } finally {
    //         utils.setLoading(false);
    //     }
    // },

    // 获取当前所有已勾选的sheet名称数组
    getSelectedSheets() {
        const checkboxes = elements.sheetSelect.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.value);

    },

    // 同步 state.currentSheets 并刷新预览
    syncSelectedSheets() {
        state.currentSheets = this.getSelectedSheets();
        if (state.currentSheets.length > 0) {
            this.handleSheetSelect(state.currentSheets[0]);
        }
    },

    // 实际执行预览（始终只预览一个 sheet）
    async handleSheetPreview(sheetName) {
        if (!state.sessionId) return;
        utils.setLoading(true, '正在加载数据...');

        try {
            const previewData = await api.previewData(state.sessionId, sheetName, 1, 20);
            ui.initDataTable(previewData);
        } catch (error) {
            console.error('加载 Sheet 失败:', error);
            ui.addMessage(`加载失败: ${error.message}`, 'system');
        } finally {
            utils.setLoading(false);
        }
        
    },

    // 发送消息
    async handleSendMessage() {
        const message = elements.messageInput.value.trim();
        if (!message || !state.sessionId) return;
        
        // 添加用户消息
        ui.addMessage(message, 'user');
        elements.messageInput.value = '';
        elements.sendBtn.disabled = true;
        
        utils.setLoading(true, 'AI 正在思考...');
        
        try {
            // // 使用当前选中的sheet（如果有的话）
            // const response = await api.chat(state.sessionId, message, state.currentSheet);
            // 使用当前选中的 sheets（可能多个）
            const selectedSheets = state.currentSheets.length > 0 ? state.currentSheets.join(',') : null;
            const response = await api.chat(state.sessionId, message, selectedSheets);
            
            // 根据响应类型显示结果
            if (response.type === 'chart' && response.content) {
                const msgDiv = ui.addMessage({ type: 'chart' });
                const chartId = `chart-${Date.now()}`;
                msgDiv.querySelector('.chart-container').id = chartId;
                ui.renderChart(chartId, response.content);
            } else if (response.type === 'dataframe' && response.content) {
                // 显示为表格
                ui.addMessage(`\n\`\`\`\n${JSON.stringify(response.content, null, 2)}\n\`\`\``, 'assistant');
            } else {
                // 后端返回的是answer字段
                ui.addMessage(response.answer || response.content || '处理完成', 'assistant');
            }
        } catch (error) {
            ui.addMessage(`❌ 请求失败: ${error.message}`, 'system');
        } finally {
            utils.setLoading(false);
            elements.sendBtn.disabled = false;
        }
    }
};

// ===== 初始化 =====
function init() {
    // 上传区域点击
    elements.uploadArea.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    // 文件选择
    elements.fileInput.addEventListener('change', (e) => {
        handlers.handleFileUpload(e.target.files[0]);
    });
    
    // 拖拽上传
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });
    
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('dragover');
    });
    
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        handlers.handleFileUpload(e.dataTransfer.files[0]);
    });
    
    // // Sheet 选择
    // elements.sheetSelect.addEventListener('change', (e) => {
    //     handlers.handleSheetSelect(e.target.value);
    // });

    // Sheet 多选 — 使用事件委托监听 checkbox 变化
    elements.sheetSelect.addEventListener('change', (e) => {
        handlers.syncSelectedSheets();
    });

    // 全选 / 取消全选 按钮
    document.getElementById('sheetSelectAll').addEventListener('click', () => {
        const checkboxes = elements.sheetSelect.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        checkboxes.forEach(checkbox => checkbox.checked = !allChecked);
        handlers.syncSelectedSheets();
        document.getElementById('sheetSelectAll').textContent = allChecked ? '全选' : '取消全选';
    });
    
    // 发送消息
    elements.sendBtn.addEventListener('click', () => {
        handlers.handleSendMessage();
    });
    
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlers.handleSendMessage();
        }
    });
    
    // 输入框变化
    elements.messageInput.addEventListener('input', () => {
        elements.sendBtn.disabled = !state.sessionId || !elements.messageInput.value.trim();
    });
    
    // 快捷按钮
    elements.quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.messageInput.value = btn.dataset.prompt;
            elements.messageInput.focus();
            elements.sendBtn.disabled = !state.sessionId;
        });
    });
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
