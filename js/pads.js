import { state, saveToStorage } from './state.js';
import { audio } from './audio.js';
import { handleAudioUpload } from './upload.js';
import { openPadEditModal } from './ui.js';

export function renderPads() {
    const grid = document.getElementById('pads-grid');
    grid.innerHTML = '';
    
    grid.className = state.viewMode === 'grid' ? 'grid-view' : 'list-view';

    const filtered = state.pads.filter(pad => {
        const matchesSearch = pad.name.toLowerCase().includes(state.searchQuery.toLowerCase());
        const matchesFav = state.favoriteFilter ? pad.isFavorite : true;
        return matchesSearch && matchesFav;
    });

    filtered.forEach((pad, index) => {
        if (!pad.playMode) pad.playMode = 'trigger';
        if (pad.isLocked === undefined) pad.isLocked = false; // 初期状態はアンロック

        const padEl = document.createElement('div');
        padEl.className = `sampler-pad ${pad.isLocked ? 'pad-locked' : ''}`;
        padEl.dataset.id = pad.id;
        padEl.dataset.index = index;
        padEl.draggable = !pad.isLocked; // ロック中はドラッグ＆ドロップも無効化
        padEl.style.setProperty('--pad-color', pad.color || '#00adb5');
        if (pad.image) padEl.style.backgroundImage = `url('${pad.image}')`;

        const modeBadge = pad.playMode === 'gate' ? '単[G]' : '連[T]';
        const lockIcon = pad.isLocked ? '🔒' : '🔓';

        // 💡 ヘッダーのアクションに pad-lock-btn を追加
        // 💡 下部の各種インプットに、ロック状態に応じて disabled 属性を付与
        padEl.innerHTML = `
            <div class="pad-header">
                <span class="pad-key-badge">${pad.key.toUpperCase()} <small>${modeBadge}</small></span>
                <div class="pad-actions">
                    <button class="pad-btn pad-fav-btn ${pad.isFavorite ? 'active-fav' : ''}">★</button>
                    <button class="pad-btn pad-mute-btn ${pad.mute ? 'active-mute' : ''}">M</button>
                    <button class="pad-btn pad-solo-btn ${pad.solo ? 'active-solo' : ''}">S</button>
                    <button class="pad-btn pad-lock-btn" title="コントロールをロック">${lockIcon}</button>
                    <button class="pad-btn pad-edit-btn">⚙️</button>
                </div>
            </div>
            <div class="pad-body">${pad.name}</div>
            <div class="pad-footer">
                <label class="pad-btn ${pad.isLocked ? 'disabled-clicked' : ''}">
                    ☁️<input type="file" class="pad-upload" accept="audio/*" style="display:none;" ${pad.isLocked ? 'disabled' : ''}>
                </label>
                <div class="pad-knobs">
                    <label>Vol<input type="range" class="knob-vol" min="0" max="1" step="0.1" value="${pad.volume ?? 1}" ${pad.isLocked ? 'disabled' : ''}></label>
                    <label class="pitch-label-group">
                        Pch
                        <div class="pitch-control-flex">
                            <input type="range" class="knob-pitch" min="0.5" max="2" step="0.1" value="${pad.pitch ?? 1}" ${pad.isLocked ? 'disabled' : ''}>
                            <button class="pad-btn btn-pitch-reset" title="ピッチをリセット" ${pad.isLocked ? 'disabled' : ''}>↺</button>
                        </div>
                    </label>
                    <label>Lp<input type="checkbox" class="knob-loop" ${pad.loop ? 'checked' : ''} ${pad.isLocked ? 'disabled' : ''}></label>
                </div>
            </div>
        `;

        // 🎵 トリガー系イベント
        const startTrigger = (e) => {
            if (e.target.closest('.pad-actions') || e.target.closest('.pad-footer')) return;
            e.preventDefault();
            triggerPad(pad);
        };

        const endTrigger = () => {
            if (pad.playMode === 'gate' && !pad.loop) {
                audio.stopPad(pad.id);
            }
        };

        padEl.addEventListener('mousedown', startTrigger);
        padEl.addEventListener('mouseup', endTrigger);
        padEl.addEventListener('mouseleave', endTrigger);
        padEl.addEventListener('touchstart', startTrigger);
        padEl.addEventListener('touchend', endTrigger);

        // ボタン・コントロールのイベント登録
        padEl.querySelector('.pad-fav-btn').addEventListener('click', (e) => { e.stopPropagation(); pad.isFavorite = !pad.isFavorite; saveToStorage(); renderPads(); });
        padEl.querySelector('.pad-mute-btn').addEventListener('click', (e) => { e.stopPropagation(); pad.mute = !pad.mute; saveToStorage(); renderPads(); });
        padEl.querySelector('.pad-solo-btn').addEventListener('click', (e) => { e.stopPropagation(); pad.solo = !pad.solo; saveToStorage(); renderPads(); });
        
        // 🔒 ロックボタンのトグル処理
        padEl.querySelector('.pad-lock-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            pad.isLocked = !pad.isLocked;
            saveToStorage();
            renderPads(); // disabled状態をHTMLに反映するため再描画
        });

        padEl.querySelector('.pad-edit-btn').addEventListener('click', (e) => { e.stopPropagation(); openPadEditModal(pad); });
        
        // ロック中ならファイル変更を受け付けない
        if (!pad.isLocked) {
            padEl.querySelector('.pad-upload').addEventListener('change', (e) => {
                handleAudioUpload(e.target.files[0], pad.id);
            });

            padEl.querySelector('.knob-vol').addEventListener('input', (e) => { pad.volume = parseFloat(e.target.value); saveToStorage(); });
            
            const pitchSlider = padEl.querySelector('.knob-pitch');
            pitchSlider.addEventListener('input', (e) => { pad.pitch = parseFloat(e.target.value); saveToStorage(); });

            padEl.querySelector('.btn-pitch-reset').addEventListener('click', (e) => {
                e.stopPropagation();
                pad.pitch = 1.0;
                pitchSlider.value = 1.0;
                saveToStorage();
            });

            padEl.querySelector('.knob-loop').addEventListener('change', (e) => { pad.loop = e.target.checked; saveToStorage(); });
        } else {
            // ロック中にリセットボタンなどをクリックした時の発火防止
            padEl.querySelector('.btn-pitch-reset').addEventListener('click', (e) => e.stopPropagation());
        }

        setupDragAndDrop(padEl);
        grid.appendChild(padEl);
    });
}

export function triggerPad(pad) {
    pad.playCount = (pad.playCount || 0) + 1;
    pad.lastPlayed = new Date().toLocaleString('ja-JP');
    audio.playPad(pad);

    const el = document.querySelector(`.sampler-pad[data-id="${pad.id}"]`);
    if (el) {
        el.classList.add('playing');
        setTimeout(() => el.classList.remove('playing'), 120);
    }
    saveToStorage();
}

function setupDragAndDrop(el) {
    el.addEventListener('dragstart', (e) => {
        if (el.classList.contains('pad-locked')) {
            e.preventDefault();
            return;
        }
        el.classList.add('dragging');
        e.dataTransfer.setData('text/plain', el.dataset.index);
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', (e) => e.preventDefault());
    el.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = parseInt(el.dataset.index);
        
        // 移動対象、または移動先がロックされている場合は並び替えを拒否
        const fromPad = state.pads[fromIndex];
        const toPad = state.pads[toIndex];
        if (fromPad?.isLocked || toPad?.isLocked) {
            console.log("ロックされたパッドの移動・割り込みはできません。");
            return;
        }
        
        if (fromIndex !== toIndex) {
            const movedPad = state.pads.splice(fromIndex, 1)[0];
            state.pads.splice(toIndex, 0, movedPad);
            saveToStorage();
            renderPads();
        }
    });
}