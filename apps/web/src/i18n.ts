import { createI18n } from 'vue-i18n';
import fa from './locales/fa.json';
import en from './locales/en.json';

const saved = localStorage.getItem('arazchat_locale') as 'fa' | 'en' | null;

export const i18n = createI18n({
  legacy: false,
  locale: saved ?? 'fa',
  fallbackLocale: 'en',
  messages: { fa, en },
});

export function applyDocumentLocale(locale: 'fa' | 'en') {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.dataset.locale = locale;
  localStorage.setItem('arazchat_locale', locale);
}

applyDocumentLocale((saved ?? 'fa') as 'fa' | 'en');
