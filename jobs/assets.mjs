// Favicon'lari yerelde uretir. Ag istegi yok.

import fs from 'node:fs/promises';
import path from 'node:path';
import { q, close } from '../packages/core/db.mjs';
import { log } from '../packages/core/log.mjs';

const HEDEF = path.join(process.cwd(), 'packages', 'core', 'assets', 'favicon');
const HARFLER = ['B', 'D', 'V', 'K', 'P', 'S', 'T', 'M', 'A', 'R', 'N', 'Y', 'C', 'L', 'Z', 'F', 'H', 'G', 'O', 'U', 'E'];

function svg(harf, renk) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${renk}"/><text x="32" y="45" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="36" font-weight="700" fill="#fff">${harf}</text></svg>\n`;
}

try {
  await fs.mkdir(HEDEF, { recursive: true });
  const satirlar = await q('SELECT site_id, renk FROM skins ORDER BY site_id');

  for (const s of satirlar) {
    const harf = HARFLER[(s.site_id - 1) % HARFLER.length];
    const renk = s.renk ?? '#6366F1';
    const ad = `${s.site_id}.svg`;
    await fs.writeFile(path.join(HEDEF, ad), svg(harf, renk), 'utf8');
    await q('UPDATE skins SET favicon = ? WHERE site_id = ?', [`/assets/favicon/${ad}`, s.site_id]);
  }

  log.info('favicon uretildi', { adet: satirlar.length });
} catch (e) {
  log.error('assets hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}