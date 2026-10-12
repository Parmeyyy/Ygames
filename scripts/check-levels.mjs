// Проверка уровней без запуска игры: npm run check
// Ищет опечатки, из-за которых уровень сломается или покажет ключ вместо текста:
// нет текста на одном из языков, шаг ссылается на несуществующий объект, неизвестный тип или картинка.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const source = (file) => readFileSync(path.join(root, file), 'utf8');

const dicts = { ru: read('src/i18n/ru.json'), en: read('src/i18n/en.json') };
// имена картинок и типов берём прямо из кода, чтобы список не устаревал
const shapes = new Set([...source('src/ui/shapes.js').matchAll(/^ {2}(\w+): \{ draw:/gm)].map((m) => m[1]));
const builtIn = new Set(['chip', 'word', 'button', 'figure', 'box', 'dot', 'ring', 'card', 'zone', 'clock', 'item']);
const types = new Set([...source('src/level-types/index.js').matchAll(/^ {2}(\w+): build/gm)].map((m) => m[1]));
const heroParts = new Set(['head', 'forehead', 'mouth', 'chest', 'hand', 'body']);

const problems = [];
let count = 0;

for (const section of readdirSync(path.join(root, 'src/levels'), { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const file of readdirSync(path.join(root, 'src/levels', section.name)).sort()) {
    const level = read(`src/levels/${section.name}/${file}`);
    const where = `${section.name}/${file} (${level.id})`;
    const fail = (message) => problems.push(`${where}: ${message}`);
    count += 1;

    if (!types.has(level.type)) fail(`неизвестный тип "${level.type}"`);

    // тексты: обязательные и те, на которые ссылается уровень
    const keys = new Set(['question', 'hint', 'win']);
    if (level.word) keys.add(level.word);
    for (const item of [...(level.objects ?? []), ...(level.options ?? []), ...(level.decoys ?? [])]) {
      if (item.labelKey) keys.add(item.labelKey);
    }
    for (const step of level.steps ?? []) {
      if (step.early) keys.add(step.early);
      if (step.then?.say) keys.add(step.then.say);
    }
    if (level.action?.count > 1) keys.add('partial');
    for (const [lang, dict] of Object.entries(dicts)) {
      const texts = dict.levels?.[level.id];
      if (!texts) {
        fail(`нет текстов на ${lang}`);
        continue;
      }
      for (const key of keys) if (typeof texts[key] !== 'string' || !texts[key]) fail(`нет текста "${key}" на ${lang}`);
    }
    if (level.word) {
      for (const [lang, dict] of Object.entries(dicts)) {
        const texts = dict.levels?.[level.id] ?? {};
        const words = (texts.question ?? '').toLowerCase().split(' ').map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''));
        if (!words.includes((texts[level.word] ?? '').toLowerCase())) fail(`в вопросе на ${lang} нет слова "${texts[level.word]}"`);
      }
    }

    // объекты
    const ids = new Set();
    for (const object of level.objects ?? []) {
      if (ids.has(object.id)) fail(`объект "${object.id}" объявлен дважды`);
      const shape = object.shape ?? 'chip';
      if (!builtIn.has(shape) && !shapes.has(shape)) fail(`объект "${object.id}": неизвестная картинка "${shape}"`);
      if (object.at) {
        const [parent] = object.at;
        const known = parent.startsWith('hero:') ? heroParts.has(parent.slice(5)) : ids.has(parent);
        if (!known) fail(`объект "${object.id}": привязан к "${parent}", которого нет выше по списку`);
      } else if (typeof object.x !== 'number' || typeof object.y !== 'number') {
        fail(`объект "${object.id}": нет координат x, y`);
      }
      ids.add(object.id);
    }

    // на кого ссылаются шаги и ответы
    const exists = (ref) =>
      ids.has(ref) ||
      ref === 'hero' ||
      ref === 'ui:coin' ||
      (ref === 'word' && Boolean(level.word)) ||
      (ref.startsWith('hero:') && heroParts.has(ref.slice(5))) ||
      ['ui:hero', 'ui:question', 'ui:levelNumber'].includes(ref);
    for (const [index, step] of (level.steps ?? []).entries()) {
      for (const key of ['drag', 'onto', 'target', 'from']) {
        if (step[key] && !exists(step[key])) fail(`шаг ${index + 1}: нет объекта "${step[key]}"`);
      }
      for (const id of [...(step.then?.hide ?? []), ...(step.then?.show ?? []), ...Object.keys(step.then?.swap ?? {})]) {
        if (!ids.has(id)) fail(`шаг ${index + 1}: нет объекта "${id}"`);
      }
      for (const shape of Object.values(step.then?.swap ?? {})) if (!shapes.has(shape)) fail(`шаг ${index + 1}: неизвестная картинка "${shape}"`);
      const hand = step.then?.hero?.hand;
      if (hand && !shapes.has(hand)) fail(`шаг ${index + 1}: неизвестная картинка в руке "${hand}"`);
    }
    if (['sequence', 'combine', 'wordDrag', 'offscreen', 'rotate'].includes(level.type) && !level.steps?.length) fail('нет шагов');
    if (level.type === 'tap' && !exists(level.answer ?? '')) fail(`нет объекта-ответа "${level.answer}"`);
    if (level.type === 'choice' && !level.compute && !level.options?.some((o) => o.id === level.answer)) fail('ответа нет среди вариантов');
    if (level.type === 'erase' && !ids.has(level.erase?.target)) fail(`нет объекта для стирания "${level.erase?.target}"`);
    if (level.goal) for (const ref of [level.goal.drag, level.goal.onto]) if (!exists(ref)) fail(`цель: нет объекта "${ref}"`);
    if (level.signal?.frames) for (const frame of level.signal.frames) if (!ids.has(frame.id)) fail(`сигнал: нет объекта "${frame.id}"`);
  }
}

// одинаковый набор ключей в обоих языках
const flat = (node, prefix = '') =>
  Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === 'object' && !Array.isArray(value) ? flat(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
const [ruKeys, enKeys] = [new Set(flat(dicts.ru)), new Set(flat(dicts.en))];
for (const key of ruKeys) if (!enKeys.has(key)) problems.push(`тексты: ключ "${key}" есть в ru, но нет в en`);
for (const key of enKeys) if (!ruKeys.has(key)) problems.push(`тексты: ключ "${key}" есть в en, но нет в ru`);

console.log(`Проверено уровней: ${count}`);
if (problems.length) {
  console.log(`Найдено проблем: ${problems.length}`);
  for (const problem of problems) console.log(' -', problem);
  process.exit(1);
}
console.log('Проблем не найдено');
