export const state = {
    pads: [],
    masterVolume: 0.8,
    theme: 'dark',
    viewMode: 'grid',
    favoriteFilter: false,
    searchQuery: ''
};

export function saveToStorage() {
    localStorage.setItem('web_sampler_studio_v2', JSON.stringify({
        pads: state.pads,
        masterVolume: state.masterVolume,
        theme: state.theme,
        viewMode: state.viewMode
    }));
}

export function loadFromStorage() {
    const saved = localStorage.getItem('web_sampler_studio_v2');
    return saved ? JSON.parse(saved) : null;
}