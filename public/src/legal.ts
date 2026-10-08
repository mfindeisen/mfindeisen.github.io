import '@fontsource-variable/outfit';
import '../styles/legal.css';
import { initI18n } from './i18n/i18n.js';
import { dictionaries } from './i18n/strings.js';

document.addEventListener('DOMContentLoaded', () => {
    // Legal copy stays German; only chrome like the back link follows the preferred locale.
    initI18n(dictionaries, { updateDocumentLang: false });
});
