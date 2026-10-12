// Помощники для разработки. Работают только при `npm run dev`:
// в сборке import.meta.env.DEV равен false, и этот код из неё выбрасывается.
//   ?level=m15 — сразу открыть уровень по его id (m15 — «Утро», уровень 15; s1 — секретный раздел)
//   ?unlock    — открыть все разделы и уровни
const params = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;

export const dev = {
  level: params?.get('level') ?? null,
  unlockAll: params?.has('unlock') ?? false,
};
