// Sozdizimi denetimi: apps, packages, scripts, jobs, db altindaki tum JS dosyalari.
// Dizinler Node ile gezilir; boylece Windows cmd'de "for/find" sorunu olmaz.
// node_modules ve dist haric tutulur.

import { readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const KOKLER = ['apps', 'packages', 'scripts', 'jobs', 'db'];
const ATLA = new Set(['node_modules', 'dist', '.git', 'assets']);
const UZANTI = new Set(['.mjs', '.js', '.cjs']);

const dosyalar = [];

function gez(dizin) {
  let kayitlar;
  try {
    kayitlar = readdirSync(dizin, { withFileTypes: true });
  } catch {
    return;
  }

  for (const k of kayitlar) {
    if (ATLA.has(k.name)) continue;
    const yol = join(dizin, k.name);
    if (k.isDirectory()) gez(yol);
    else if (UZANTI.has(extname(k.name))) dosyalar.push(yol);
  }
}

for (const kok of KOKLER) gez(kok);

if (dosyalar.length === 0) {
  console.error('denetlenecek dosya bulunamadi');
  process.exit(1);
}

const hatali = [];

for (const dosya of dosyalar) {
  const s = spawnSync(process.execPath, ['--check', dosya], { encoding: 'utf8' });
  if (s.status !== 0) {
    hatali.push({ dosya, cikti: (s.stderr ?? '').trim() });
  }
}

if (hatali.length > 0) {
  for (const h of hatali) console.error(`${h.dosya}\n${h.cikti}\n`);
  console.error(`${hatali.length} dosyada sozdizimi hatasi`);
  process.exit(1);
}

console.log(`${dosyalar.length} dosya temiz`);