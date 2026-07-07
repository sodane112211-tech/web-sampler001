import { state, saveToStorage } from './state.js';
import { audio } from './audio.js';
import { renderPads } from './pads.js';

export async function handleAudioUpload(file, padId) {
    if (!file || !file.type.startsWith('audio/')) {
        alert('有効な音声ファイルを指定してください。');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            audio.init();
            const audioBuffer = await audio.ctx.decodeAudioData(e.target.result);
            audio.bufferCache.set(padId, audioBuffer);

            const pad = state.pads.find(p => p.id === padId);
            if (pad) {
                pad.name = file.name.split('.')[0];
                pad.sample = `blob:${file.name}_${Date.now()}`;
                renderPads();
                saveToStorage();
            }
        } catch (err) {
            alert('デコードに失敗しました。');
        }
    };
    reader.readAsArrayBuffer(file);
}