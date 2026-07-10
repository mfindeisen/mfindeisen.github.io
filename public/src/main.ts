import '../style.css';
import { App } from './core/App.js';

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        // Force a full reload on HMR so we don't have stale App instances listening to events
        window.location.reload();
    });
}
