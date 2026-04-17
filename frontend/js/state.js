/**
 * 状态管理
 */
export const state = {
    sessionId: null,
    fileId: null,
    sheets: [],
    currentSheets: [], // 确认后的选中状态
    pendingSheets: [], // 临时选择状态
    isLoading: false,
    messages: []
};
