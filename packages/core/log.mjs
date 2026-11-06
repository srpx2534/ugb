import { isProd } from './config.mjs';

const SEVIYE = { info: 30, warn: 40, error: 50 };
const ESIK = SEVIYE[process.env.LOG_SEVIYE ?? 'info'] ?? 30;

function yaz(seviye, mesaj, alan) {
  if (SEVIYE[seviye] < ESIK) return;
  const kayit = { t: new Date().toISOString(), seviye, mesaj };
  if (alan && typeof alan === 'object') Object.assign(kayit, alan);
  const satir = isProd ? JSON.stringify(kayit) : `${kayit.t} ${seviye} ${mesaj} ${alan ? JSON.stringify(alan) : ''}`;
  (seviye === 'error' ? console.error : console.log)(satir.trimEnd());
}

export const log = {
  info: (m, a) => yaz('info', m, a),
  warn: (m, a) => yaz('warn', m, a),
  error: (m, a) => yaz('error', m, a),
};