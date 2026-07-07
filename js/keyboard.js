import { state } from './state.js';
import { triggerPad } from './pads.js';
import { audio } from './audio.js';

const activeKeys = new Set();

export function initKeyboard() {
    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
        
        if (e.key === 'Escape') {
            audio.stopAll();
            return;
        }

        const targetKey = e.key.toLowerCase();
        if (activeKeys.has(targetKey)) return; // OS側のキー連打による意図しない多重発火を防ぐ
        activeKeys.add(targetKey);

        const pad = state.pads.find(p => p.key.toLowerCase() === targetKey);
        if (pad) {
            e.preventDefault();
            triggerPad(pad);
        }
    });

    window.addEventListener('keyup', (e) => {
        const targetKey = e.key.toLowerCase();
        activeKeys.delete(targetKey);

        const pad = state.pads.find(p => p.key.toLowerCase() === targetKey);
        
        // キーを離したとき、ゲートモードかつループ中でなければ再生停止
        if (pad && pad.playMode === 'gate' && !pad.loop) {
            audio.stopPad(pad.id);
        }
    });
}

export function checkKeyDuplicate(key, currentPadId) {
    return state.pads.some(p => p.key.toLowerCase() === key.toLowerCase() && p.id !== currentPadId);
}