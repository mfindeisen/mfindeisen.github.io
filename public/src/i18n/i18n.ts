export type Locale = 'en' | 'de';

export type Localized<T = string> = { en: T; de: T };

type Dict = { [key: string]: string | Dict };

const STORAGE_KEY = 'portfolio-locale';
const DEFAULT_LOCALE: Locale = 'en';

let currentLocale: Locale = DEFAULT_LOCALE;
const listeners = new Set<(locale: Locale) => void>();
let dictionary: Record<Locale, Dict> = { en: {}, de: {} };

export function registerDictionaries(dicts: Record<Locale, Dict>) {
    dictionary = dicts;
}

export function getLocale(): Locale {
    return currentLocale;
}

export function isLocale(value: unknown): value is Locale {
    return value === 'en' || value === 'de';
}

export function readStoredLocale(): Locale {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (isLocale(stored)) return stored;
    } catch {
        // ignore private-mode / blocked storage
    }
    return DEFAULT_LOCALE;
}

function lookup(locale: Locale, key: string): string | undefined {
    const parts = key.split('.');
    let cur: string | Dict | undefined = dictionary[locale];
    for (const part of parts) {
        if (!cur || typeof cur === 'string') return undefined;
        cur = cur[part];
    }
    return typeof cur === 'string' ? cur : undefined;
}

export function t(key: string, params?: Record<string, string | number>): string {
    let value = lookup(currentLocale, key) ?? lookup(DEFAULT_LOCALE, key) ?? key;
    if (params) {
        for (const [name, param] of Object.entries(params)) {
            value = value.replaceAll(`{${name}}`, String(param));
        }
    }
    return value;
}

export function loc<T>(value: Localized<T> | T): T {
    if (value && typeof value === 'object' && 'en' in (value as object) && 'de' in (value as object)) {
        return (value as Localized<T>)[currentLocale] ?? (value as Localized<T>).en;
    }
    return value as T;
}

export function onLocaleChange(listener: (locale: Locale) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function applyTranslations(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        if (key) el.textContent = t(key);
    });

    root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
        const key = el.dataset.i18nHtml;
        if (key) el.innerHTML = t(key);
    });

    root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
        const key = el.dataset.i18nAria;
        if (key) el.setAttribute('aria-label', t(key));
    });

    root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
        const key = el.dataset.i18nTitle;
        if (key) el.setAttribute('title', t(key));
    });

    root.querySelectorAll<HTMLElement>('[data-i18n-alt]').forEach((el) => {
        const key = el.dataset.i18nAlt;
        if (key) el.setAttribute('alt', t(key));
    });

    const titleKey = document.documentElement.dataset.i18nTitle;
    if (titleKey) document.title = t(titleKey);

    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const descKey = desc?.dataset.i18n;
    if (desc && descKey) desc.setAttribute('content', t(descKey));
}

function syncSwitcher(): void {
    document.querySelectorAll<HTMLElement>('[data-locale-option]').forEach((btn) => {
        const option = btn.dataset.localeOption;
        const active = option === currentLocale;
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.classList.toggle('is-active', active);
    });
}

export function setLocale(
    locale: Locale,
    { persist = true, updateDocumentLang = true }: { persist?: boolean; updateDocumentLang?: boolean } = {},
): void {
    if (!isLocale(locale)) return;
    currentLocale = locale;
    if (updateDocumentLang) document.documentElement.lang = locale;

    if (persist) {
        try {
            localStorage.setItem(STORAGE_KEY, locale);
        } catch {
            // ignore
        }
    }

    applyTranslations();
    syncSwitcher();
    listeners.forEach((listener) => listener(locale));
}

export function initI18n(
    dicts: Record<Locale, Dict>,
    { updateDocumentLang = true }: { updateDocumentLang?: boolean } = {},
): Locale {
    registerDictionaries(dicts);
    const locale = readStoredLocale();
    currentLocale = locale;
    if (updateDocumentLang) document.documentElement.lang = locale;
    applyTranslations();
    syncSwitcher();

    document.querySelectorAll<HTMLElement>('[data-locale-option]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = btn.dataset.localeOption;
            if (isLocale(next)) setLocale(next, { updateDocumentLang });
        });
    });

    return locale;
}
