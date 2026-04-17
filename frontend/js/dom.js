/**
 * DOM 元素管理
 */
export const elements = {
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
