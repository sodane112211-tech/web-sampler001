import { state, saveToStorage } from './state.js';
import { renderPads } from './pads.js';
import { checkKeyDuplicate } from './keyboard.js';
import { exportJSON, importJSON } from './exportImport.js';
import { resetToDefault } from './storage.js';

export function setupUIEventListeners() {
    const modal = document.getElementById('config-modal');
    document.getElementById('btn-config').addEventListener('click', () => modal.classList.remove('hidden'));
    document.querySelector('.close-modal').addEventListener('click', () => modal.classList.add('hidden'));

    document.getElementById('apply-pad-count').addEventListener('click', () => {
        const count = parseInt(document.getElementById('pad-count-select').value);
        if (count < 4 || count > 128) return alert('パッド数は4〜128の間で指定してください。');
        
        if (state.pads.length < count) {
            const startId = state.pads.length + 1;
            for(let i = startId; i <= count; i++) {
                state.pads.push({ id: i, name: `Pad ${i}`, sample: '', key: '', volume: 1, pitch: 1, loop: false, color: '#202024', playMode: 'trigger' });
            }
        } else if (state.pads.length > count) {
            state.pads = state.pads.slice(0, count);
        }
        saveToStorage();
        renderPads();
        modal.classList.add('hidden');
    });

    document.getElementById('view-grid').addEventListener('click', () => {
        state.viewMode = 'grid';
        document.getElementById('view-grid').classList.add('active');
        document.getElementById('view-list').classList.remove('active');
        saveToStorage(); renderPads();
    });
    document.getElementById('view-list').addEventListener('click', () => {
        state.viewMode = 'list';
        document.getElementById('view-list').classList.add('active');
        document.getElementById('view-grid').classList.remove('active');
        saveToStorage(); renderPads();
    });

    document.getElementById('btn-export').addEventListener('click', exportJSON);
    
    const fileInput = document.getElementById('import-file');
    document.getElementById('btn-import-trigger').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        importJSON(e.target.files[0], () => {
            renderPads();
            modal.classList.add('hidden');
        });
    });

    document.getElementById('btn-reset').addEventListener('click', resetToDefault);

    document.querySelector('.close-edit-modal').addEventListener('click', () => {
        document.getElementById('pad-edit-modal').classList.add('hidden');
    });

    // 個別パッド詳細設定の保存
    document.getElementById('btn-save-pad-edit').addEventListener('click', () => {
        const padId = parseInt(document.getElementById('edit-pad-id').value);
        const newKey = document.getElementById('edit-pad-key').value.toLowerCase();
        
        if (newKey && checkKeyDuplicate(newKey, padId)) {
            document.getElementById('key-error-msg').innerText = '⚠️ そのキーは他のパッドに既に割り当てられています。';
            return;
        }

        const pad = state.pads.find(p => p.id === padId);
        if (pad) {
            pad.name = document.getElementById('edit-pad-name').value;
            pad.key = newKey;
            pad.color = document.getElementById('edit-pad-color').value;
            pad.image = document.getElementById('edit-pad-image').value;
            
            // 再生モードの値をステートに格納
            pad.playMode = document.getElementById('edit-pad-play-mode').value;
            
            saveToStorage();
            renderPads();
            document.getElementById('pad-edit-modal').classList.add('hidden');
        }
    });
}

export function openPadEditModal(pad) {
    const modal = document.getElementById('pad-edit-modal');
    document.getElementById('edit-pad-title').innerText = pad.name;
    document.getElementById('edit-pad-id').value = pad.id;
    document.getElementById('edit-pad-name').value = pad.name;
    document.getElementById('edit-pad-key').value = pad.key;
    document.getElementById('edit-pad-color').value = pad.color || '#202024';
    document.getElementById('edit-pad-image').value = pad.image || '';
    
    // 現在の再生モードをセレクトボックスに同期
    document.getElementById('edit-pad-play-mode').value = pad.playMode || 'trigger';
    
    document.getElementById('key-error-msg').innerText = '';

    document.getElementById('stat-play-count').innerText = pad.playCount || 0;
    document.getElementById('stat-last-played').innerText = pad.lastPlayed || '-';
    document.getElementById('stat-total-duration').innerText = Math.round(pad.totalDuration || 0);

    modal.classList.remove('hidden');
}