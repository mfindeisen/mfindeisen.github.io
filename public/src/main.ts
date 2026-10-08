import '@fontsource-variable/outfit';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../style.css';
import { initPortfolioI18n } from './i18n/i18n.js';
import { App } from './core/App.js';

document.addEventListener('DOMContentLoaded', () => {
    initPortfolioI18n(document.getElementById('portfolio-overlay'));
    window.app = new App();
});

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        // Force a full reload on HMR so we don't have stale App instances listening to events
        window.location.reload();
    });
}
