import { state, saveToStorage } from './state.js';

export function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.pads, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "web-sampler-studio-config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

export function importJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedPads = JSON.parse(e.target.result);
            if (Array.isArray(importedPads)) {
                state.pads = importedPads;
                saveToStorage();
                callback();
            } else {
                alert('不正なJSON形式です。');
            }
        } catch (err) {
            alert('JSONの解析に失敗しました。');
        }
    };
    reader.readAsText(file);
}