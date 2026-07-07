import { state, loadFromStorage, saveToStorage } from './state.js';
import { audio } from './audio.js';
import { renderPads } from './pads.js';
import { initKeyboard } from './keyboard.js';
import { initTheme } from './theme.js';
import { setupUIEventListeners } from './ui.js';

async function initApp() {
    const savedState = loadFromStorage();
    if (savedState) {
        state.pads = savedState.pads;
        state.masterVolume = savedState.masterVolume ?? 0.8;
        state.theme = savedState.theme ?? 'dark';
        state.viewMode = savedState.viewMode ?? 'grid';
    } else {
        try {
            const res = await fetch('data/default-pads.json');
            state.pads = await res.json();
        } catch (e) {
            state.pads = [
                { id: 1, name: "Pad 1", sample: "", key: "a", volume: 1, pitch: 1, loop: false, color: "#ff4757" }
            ];
        }
    }

    // ビュー状態の適用
    if (state.viewMode === 'list') {
        document.getElementById('view-list').classList.add('active');
        document.getElementById('view-grid').classList.remove('active');
    }

    document.getElementById('master-volume').value = state.masterVolume;
    audio.setMasterVolume(state.masterVolume);

    // 初回音源ロード
    state.pads.forEach(pad => {
        if (pad.sample) audio.loadSample(pad.id, pad.sample);
    });

    renderPads();
    initKeyboard();
    initTheme();
    setupUIEventListeners();
    setupGlobalEvents();
}

function setupGlobalEvents() {
    document.getElementById('master-volume').addEventListener('input', (e) => {
        audio.setMasterVolume(parseFloat(e.target.value));
        saveToStorage();
    });

    document.getElementById('stop-all-btn').addEventListener('click', () => {
        audio.stopAll();
    });

    document.getElementById('search-pads').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderPads();
    });

    document.getElementById('filter-favorites').addEventListener('click', (e) => {
        state.favoriteFilter = !state.favoriteFilter;
        e.target.classList.toggle('active', state.favoriteFilter);
        renderPads();
    });
}

window.addEventListener('DOMContentLoaded', initApp);