import { elements } from './dom.js';
import { state } from './state.js';
import { utils } from './utils.js';

/**
 * UI 更新
 */
export const ui = {
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
