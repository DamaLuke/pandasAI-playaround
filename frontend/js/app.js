/**
 * ChatExcel 前端应用
 * 基于 ES Modules 模块化架构
 */
import { elements } from './dom.js';
import { state } from './state.js';
import { handlers } from './handlers.js';
import { ui } from './ui.js';

/**
 * 初始化
 */
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

    // 全选 / 取消全选 按钮
    document.getElementById('sheetSelectAll').addEventListener('click', () => {
        const checkboxes = elements.sheetSelect.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        checkboxes.forEach(checkbox => checkbox.checked = !allChecked);
        handlers.syncPendingSheets();  // 只更新临时状态，不立即预览
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

    // Sheet 选择器的事件绑定（确认/取消按钮使用事件委托）
    elements.sheetSelect.addEventListener('click', (e) => {
        if (e.target.id === 'sheetConfirmBtn') {
            handlers.handleSheetConfirm();
        } else if (e.target.id === 'sheetCancelBtn') {
            handlers.handleSheetCancel();
        }
    });

    // 复选框变化只更新临时状态
    elements.sheetSelect.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            handlers.syncPendingSheets();
        }
    });

}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
