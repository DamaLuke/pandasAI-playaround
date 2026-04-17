import { CONFIG } from './config.js';
import { elements } from './dom.js';
import { state } from './state.js';

/**
 * 工具函数
 */
export const utils = {
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
