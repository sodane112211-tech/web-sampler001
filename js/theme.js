import { state, saveToStorage } from './state.js';

export function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('theme-toggle').addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        saveToStorage();
    });
}