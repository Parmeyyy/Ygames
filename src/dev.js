// Помощники для разработки. Работают только при `npm run dev`:
// в сборке import.meta.env.DEV равен false, и этот код из неё выбрасывается.
//   ?level=15  — сразу открыть уровень 15 (или ?level=s1 для секретной главы)
//   ?unlock    — открыть все уровни в выборе уровней
const params = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;

export const dev = {
  level: params?.get('level') ?? null,
  unlockAll: params?.has('unlock') ?? false,
};
