import { state } from './state.js';
import { elements } from './dom.js';
import { api } from './api.js';
import { ui } from './ui.js';
import { utils } from './utils.js';

/**
 * 事件处理器
 */
export const handlers = {
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

    // 获取当前所有已勾选的sheet名称数组
    getSelectedSheets() {
        const checkboxes = elements.sheetSelect.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.value);
    },

    // 同步 state.currentSheets 并刷新预览
    syncSelectedSheets() {
        state.currentSheets = this.getSelectedSheets();
        if (state.currentSheets.length > 0) {
            this.handleSheetPreview(state.currentSheets[0]);
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
    },

// 新增方法：处理 Sheet 确认
    async handleSheetConfirm() {
        const selected = this.getSelectedSheets();
        if (selected.length === 0) {
            alert('请至少选择一个 Sheet');
            return;
        }
        state.currentSheets = [...selected];  // 确认保存到当前状态
        ui.addMessage(`📊 已选择工作表: ${selected.join(', ')}`, 'system');
        
        // 可选：发送到后端
        // await api.confirmSheets(state.sessionId, state.currentSheets);
    },

    // 新增方法：处理 Sheet 取消
    handleSheetCancel() {
        // 取消时：清空临时选择，恢复之前的确认状态
        const checkboxes = elements.sheetSelect.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = state.currentSheets.includes(cb.value);
        });
        ui.addMessage('❌ 已取消选择', 'system');
    },

    // 修改：复选框变化只更新临时状态，不立即触发预览
    syncPendingSheets() {
        state.pendingSheets = this.getSelectedSheets();
    }

};

