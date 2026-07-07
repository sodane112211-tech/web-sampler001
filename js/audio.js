import { state } from './state.js';

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.bufferCache = new Map();
        this.activeNodes = new Map(); // padId -> { source, gainNode, startTime }
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(state.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
    }

    setMasterVolume(val) {
        state.masterVolume = val;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
        }
    }

    async loadSample(padId, urlOrBlob) {
        this.init();
        try {
            let arrayBuffer;
            if (urlOrBlob.startsWith('blob:')) {
                return; // アップロード時にロード済み
            } else {
                const response = await fetch(urlOrBlob);
                arrayBuffer = await response.arrayBuffer();
            }
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.bufferCache.set(padId, audioBuffer);
        } catch (e) {
            console.warn(`サンプルのロードスキップまたは失敗: ${urlOrBlob}`);
        }
    }

    playPad(pad) {
        this.init();
        
        // ミュート、ソロチェック
        if (pad.mute) return;
        const hasSolo = state.pads.some(p => p.solo);
        if (hasSolo && !pad.solo) return;

        const buffer = this.bufferCache.get(pad.id);
        if (!buffer) return;

        this.stopPad(pad.id);

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.setValueAtTime(pad.pitch || 1.0, this.ctx.currentTime);
        source.loop = pad.loop || false;

        const padGain = this.ctx.createGain();
        padGain.gain.setValueAtTime(pad.volume !== undefined ? pad.volume : 1.0, this.ctx.currentTime);

        source.connect(padGain);
        padGain.connect(this.masterGain);

        source.start(0);
        
        this.activeNodes.set(pad.id, {
            source: source,
            gainNode: padGain,
            startTime: this.ctx.currentTime
        });
    }

    stopPad(padId) {
        if (this.activeNodes.has(padId)) {
            const nodeInfo = this.activeNodes.get(padId);
            try {
                nodeInfo.source.stop();
                // 総再生時間の算出
                const elapsed = this.ctx.currentTime - nodeInfo.startTime;
                const pad = state.pads.find(p => p.id === padId);
                if (pad) pad.totalDuration = (pad.totalDuration || 0) + elapsed;
            } catch (e) {}
            this.activeNodes.delete(padId);
        }
    }

    stopAll() {
        for (let padId of this.activeNodes.keys()) {
            this.stopPad(padId);
        }
    }
}

export const audio = new AudioEngine();