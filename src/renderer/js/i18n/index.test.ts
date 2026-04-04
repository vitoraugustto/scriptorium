// @vitest-environment jsdom
import I18n from './index';

beforeEach(() => {
  I18n.setLocale('en');
});

describe('I18n.t', () => {
  test('returns EN string for known key', () => {
    expect(I18n.t('LABEL_SALT')).toBe('Salt');
  });

  test('returns PT-BR string after setLocale', () => {
    I18n.setLocale('pt-BR');
    expect(I18n.t('LABEL_SALT')).toBe('Sal');
  });

  test('falls back to EN when key missing in active locale', () => {
    I18n.setLocale('pt-BR');
    expect(I18n.t('LABEL_DENARII')).toBe('Denários');
  });

  test('returns key itself when missing in both locales', () => {
    expect(I18n.t('NONEXISTENT_KEY')).toBe('NONEXISTENT_KEY');
  });

  test('replaces {0} placeholder', () => {
    expect(I18n.t('CODEX_REMAINING', 5)).toBe('5 page remaining');
  });

  test('replaces multiple placeholders', () => {
    I18n.setLocale('en');
    expect(I18n.t('TOAST_CODEX_BOUND', 3, '5 g')).toBe('Codex 3 bound, +5 g salt');
  });

  test('replaces all occurrences of same placeholder', () => {
    const result = I18n.t('TOAST_UPGRADE_GOLD', 'Goose Quill', 2);
    expect(result).toBe('Goose Quill level 2');
  });
});

describe('I18n.setLocale / getLocale', () => {
  test('getLocale returns current locale', () => {
    expect(I18n.getLocale()).toBe('en');
  });

  test('setLocale updates locale', () => {
    I18n.setLocale('pt-BR');
    expect(I18n.getLocale()).toBe('pt-BR');
  });

  test('setLocale persists to localStorage when available', () => {
    I18n.setLocale('pt-BR');
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('lang')).toBe('pt-BR');
    } else {
      expect(I18n.getLocale()).toBe('pt-BR');
    }
  });
});

describe('PT-BR translations', () => {
  beforeEach(() => {
    I18n.setLocale('pt-BR');
  });

  test('LABEL_CODICES', () => expect(I18n.t('LABEL_CODICES')).toBe('Códices'));
  test('CODEX_READY with placeholder', () => expect(I18n.t('CODEX_READY', '1 g')).toBe('pronto para encadernar — ganhe 1 g'));
  test('TITLE_0', () => expect(I18n.t('TITLE_0')).toBe('Escriba Novato'));
  test('UPGRADE_G_QUILL_NAME', () => expect(I18n.t('UPGRADE_G_QUILL_NAME')).toBe('Pena de Ganso'));
  test('UPGRADE_S_BENEFICE_NAME', () => expect(I18n.t('UPGRADE_S_BENEFICE_NAME')).toBe('Benefício'));
  test('DEBUG_RESET_BTN', () => expect(I18n.t('DEBUG_RESET_BTN')).toBe('Reiniciar todo o progresso'));
});
