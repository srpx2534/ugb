import { kacis } from '@ugb/core/html';

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#0B0D12;color:#E8EAEF;font:16px/1.6 -apple-system,"Segoe UI",Roboto,sans-serif;padding-bottom:78px}
.ic{max-width:640px;margin:0 auto;padding:0 14px}
header{position:sticky;top:0;z-index:10;background:rgba(11,13,18,.96);border-bottom:1px solid #1E232E;backdrop-filter:blur(10px)}
.ust{display:flex;align-items:center;justify-content:space-between;height:54px}
.logo{font-weight:800;font-size:1.05rem;color:#fff;text-decoration:none}
.logo i{color:var(--ana);font-style:normal}
.rozet{font-size:.68rem;padding:4px 9px;border:1px solid var(--ana);border-radius:999px;color:var(--ana)}
h1{font-size:1.28rem;line-height:1.3;margin:18px 0 6px}
.alt{color:#98A0AE;font-size:.86rem;margin:0 0 14px}
.banner{display:block;border-radius:12px;padding:14px 16px;margin:10px 0;text-decoration:none;color:#fff;background:linear-gradient(100deg,var(--ana),#1B2030);border:1px solid #262C3A}
.banner b{display:block;font-size:.98rem}
.banner span{font-size:.78rem;opacity:.85}
.kart{display:flex;align-items:center;gap:12px;padding:12px 14px;background:#131720;border:1px solid #1E232E;border-radius:12px;margin:9px 0}
.sira{width:26px;height:26px;flex:0 0 26px;display:grid;place-items:center;border-radius:8px;background:var(--ana);color:#fff;font-weight:700;font-size:.82rem}
.ad{flex:1;min-width:0}
.ad b{display:block;font-size:.96rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ad span{font-size:.76rem;color:#98A0AE}
.git{flex:0 0 auto;background:var(--ana);color:#fff;text-decoration:none;padding:9px 14px;border-radius:9px;font-size:.82rem;font-weight:600}
.premium{outline:1px solid var(--ana)}
footer{border-top:1px solid #1E232E;margin-top:26px;padding:18px 0;color:#7C8492;font-size:.78rem}
.yapiskan{position:fixed;left:0;right:0;bottom:0;background:rgba(11,13,18,.97);border-top:1px solid #1E232E;padding:10px 14px}
.yapiskan a{display:block;text-align:center;background:var(--ana);color:#fff;text-decoration:none;padding:13px;border-radius:10px;font-weight:700}
.tarih{font-size:.75rem;color:#7C8492;margin:0 0 10px}
`;

export function reklam({ d, markalar, canonical }) {
  const liste = markalar.slice(0, 12);
  const premium = liste.slice(0, 3);
  const kalan = liste.slice(3);

  const bannerlar = premium
    .map((m) => `<a class="banner" href="/l/${kacis(m.slug)}"><b>${kacis(m.ad)} — ${kacis(m.teklif ?? '')}</b><span>Deneme bonusu · hızlı üyelik</span></a>`)
    .join('');

  const satirlar = kalan
    .map((m, i) => `<div class="kart"><span class="sira">${i + 4}</span><span class="ad"><b>${kacis(m.ad)}</b><span>${kacis(m.teklif ?? '')}</span></span><a class="git" href="/l/${kacis(m.slug)}">Git</a></div>`)
    .join('');

  const en = liste[0];

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deneme Bonusu Veren Siteler 2026 — Güncel Liste</title>
<meta name="description" content="2026 güncel deneme bonusu listesi. Yatırımsız ve çevrimsiz kampanyalar.">
<meta name="robots" content="index, follow, noarchive">
<link rel="canonical" href="${kacis(canonical)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<style>:root{--ana:${kacis(d.ana)}}${CSS.replace(/\s+/g, ' ')}</style>
</head>
<body>
<header><div class="ic ust"><a class="logo" href="/">${kacis(d.ad)}<i>.</i></a><span class="rozet">Güncel</span></div></header>
<main><div class="ic">
<h1>Deneme Bonusu Veren Siteler 2026</h1>
<p class="alt">Yatırımsız ve çevrimsiz kampanyalar. Liste günlük kontrol edilir.</p>
<p class="tarih">Son güncelleme: ${kacis(d.tarih)}</p>
${bannerlar}
${satirlar}
</div></main>
<footer><div class="ic">Bilgilendirme amaçlıdır. Bonus şartları platformlara göre değişir.</div></footer>
<div class="yapiskan"><a href="/l/${kacis(en?.slug ?? '')}">${kacis(en?.ad ?? 'Listeye git')} — ${kacis(en?.teklif ?? '')}</a></div>
</body>
</html>`;
}