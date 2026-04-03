import en from './en';
import ptBR from './pt-BR';

const LOCALES = { en, 'pt-BR': ptBR };
let _locale = localStorage.getItem('lang') || 'en';

const t = (key, ...args) => {
  let s = LOCALES[_locale][key] ?? LOCALES['en'][key] ?? key;
  args.forEach((a, i) => { s = s.replaceAll(`{${i}}`, a); });
  return s;
};

const setLocale = (locale) => {
  _locale = locale;
  localStorage.setItem('lang', locale);
};

const getLocale = () => _locale;

export default { t, setLocale, getLocale };
