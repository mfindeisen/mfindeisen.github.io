import '@fontsource-variable/outfit';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../style.css';
import { initI18n } from './i18n/i18n.js';
import { dictionaries } from './i18n/strings.js';
import { App } from './core/App.js';

document.addEventListener('DOMContentLoaded', () => {
    initI18n(dictionaries);
    window.app = new App();
});

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        // Force a full reload on HMR so we don't have stale App instances listening to events
        window.location.reload();
    });
}
