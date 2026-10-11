import ru from './ru.json';
import en from './en.json';

const dicts = { ru, en };
// Языки, для которых показываем русский текст
const RU_LIKE = ['ru', 'be', 'kk', 'uk', 'uz'];

let lang = 'ru';

// code — код языка из SDK или браузера ("ru", "en-US", "kk", ...)
export function setLang(code) {
  const short = String(code || '').slice(0, 2).toLowerCase();
  lang = RU_LIKE.includes(short) ? 'ru' : 'en';
  document.documentElement.lang = lang;
}

const lookup = (dict, key) => key.split('.').reduce((node, part) => node?.[part], dict);

// t('ui.level', { n: 3 }) → «Уровень 3». Значением может быть и массив реплик.
export function t(key, params) {
  const value = lookup(dicts[lang], key) ?? lookup(dicts.ru, key) ?? key;
  if (typeof value !== 'string' || !params) return value;
  return value.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

// Случайная реплика из массива
export function pick(key) {
  const value = t(key);
  return Array.isArray(value) ? value[Math.floor(Math.random() * value.length)] : value;
}

// Тексты уровня лежат в levels.<id>.<key>
export function levelText(level, key) {
  return t(`levels.${level.id}.${key}`);
}

// Подпись объекта уровня: либо готовая (label), либо ключ перевода (labelKey)
export function labelOf(level, item) {
  return item.labelKey ? levelText(level, item.labelKey) : String(item.label ?? '');
}
