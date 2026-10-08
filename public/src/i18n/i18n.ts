import { portfolioStrings, uiStrings, type Dict } from './strings.js';

export type Locale = 'en' | 'de';

const STORAGE_KEY = 'portfolio-locale';
const DEFAULT_LOCALE: Locale = 'en';

let currentLocale: Locale = DEFAULT_LOCALE;
let scope: HTMLElement | null = null;

export function isLocale(value: unknown): value is Locale {
    return value === 'en' || value === 'de';
}

function detectLocale(): Locale {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (isLocale(stored)) return stored;
    } catch {
        // ignore private-mode / blocked storage
    }
    const preferred = navigator.languages?.[0] ?? navigator.language ?? '';
    return preferred.toLowerCase().startsWith('de') ? 'de' : DEFAULT_LOCALE;
}

function lookup(dict: Dict, key: string): string | undefined {
    let cur: string | Dict | undefined = dict;
    for (const part of key.split('.')) {
        if (!cur || typeof cur === 'string') return undefined;
        cur = cur[part];
    }
    return typeof cur === 'string' ? cur : undefined;
}

function format(value: string, params?: Record<string, string | number>): string {
    if (!params) return value;
    for (const [name, param] of Object.entries(params)) {
        value = value.replaceAll(`{${name}}`, String(param));
    }
    return value;
}

/** UI strings outside the portfolio; English only. */
export function t(key: string, params?: Record<string, string | number>): string {
    return format(lookup(uiStrings, key) ?? key, params);
}

function portfolioText(key: string): string {
    return lookup(portfolioStrings[currentLocale], key) ?? lookup(portfolioStrings[DEFAULT_LOCALE], key) ?? key;
}

function applyTranslations(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        if (key) el.textContent = portfolioText(key);
    });

    root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
        const key = el.dataset.i18nHtml;
        if (key) el.innerHTML = portfolioText(key);
    });

    root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
        const key = el.dataset.i18nAria;
        if (key) el.setAttribute('aria-label', portfolioText(key));
    });
}

function syncSwitcher(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>('[data-locale-option]').forEach((btn) => {
        const active = btn.dataset.localeOption === currentLocale;
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.classList.toggle('is-active', active);
    });
}

function render(): void {
    if (!scope) return;
    scope.lang = currentLocale;
    applyTranslations(scope);
    syncSwitcher(scope);
}

export function setLocale(locale: Locale): void {
    if (!isLocale(locale)) return;
    currentLocale = locale;
    try {
        localStorage.setItem(STORAGE_KEY, locale);
    } catch {
        // ignore
    }
    render();
}

/** Makes `root` (the portfolio overlay) bilingual; the rest of the page stays English. */
export function initPortfolioI18n(root: HTMLElement | null): void {
    if (!root) return;
    scope = root;
    currentLocale = detectLocale();
    render();

    root.querySelectorAll<HTMLElement>('[data-locale-option]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = btn.dataset.localeOption;
            if (isLocale(next)) setLocale(next);
        });
    });
}
