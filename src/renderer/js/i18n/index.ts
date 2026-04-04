import en from './en';
import ptBR from './pt-BR';

type LocaleKey = string;
type LocaleMap = Record<LocaleKey, string>;

const LOCALES: Record<string, LocaleMap> = { en, 'pt-BR': ptBR };
let _locale: string = (typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null) || 'en';

const t = (key: string, ...args: (string | number)[]): string => {
  let s: string = LOCALES[_locale][key] ?? LOCALES['en'][key] ?? key;
  args.forEach((a, i) => { s = s.replaceAll(`{${i}}`, String(a)); });
  return s;
};

const setLocale = (locale: string): void => {
  _locale = locale;
  if (typeof localStorage !== 'undefined') localStorage.setItem('lang', locale);
};

const getLocale = (): string => _locale;

export default { t, setLocale, getLocale };
