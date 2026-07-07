import { state, saveToStorage } from './state.js';
import { audio } from './audio.js';
import { renderPads } from './pads.js';

export async function resetToDefault() {
    if (!confirm('すべての設定を工場出荷状態にリセットしますか？')) return;
    localStorage.removeItem('web_sampler_studio_v2');
    location.reload();
}