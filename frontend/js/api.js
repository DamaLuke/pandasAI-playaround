import { CONFIG } from './config.js';

/**
 * API 封装
 */
export const api = {
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
