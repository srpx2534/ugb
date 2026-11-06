import { kacis } from '@ugb/core/html';

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#0B0D12;color:#E8EAEF;font:16px/1.7 -apple-system,"Segoe UI",Roboto,sans-serif}
.ic{max-width:820px;margin:0 auto;padding:0 18px}
header{border-bottom:1px solid #222733;padding:22px 0}
h1{font-size:1.5rem;margin:.2em 0}
p.alt{color:#98A0AE;font-size:.92rem}
ul{list-style:none;padding:0;display:grid;gap:10px;margin:24px 0 60px}
li a{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;background:#141822;border:1px solid #222733;border-radius:12px;color:#E8EAEF;text-decoration:none}
li a:hover{border-color:#4F46E5}
.m{color:#9AA1AF;font-size:.85rem}
footer{border-top:1px solid #222733;padding:20px 0;color:#7C8492;font-size:.8rem}
.gizli-blok{display:none}
`;

export function portal({ markalar, blok }) {
  const satirlar = markalar
    .map((m) => `<li><a href="/l/${kacis(m.slug)}"><span>${kacis(m.ad)}</span><span class="m">${kacis(m.teklif ?? '')}</span></a></li>`)
    .join('');

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deneme Bonusu Veren Siteler — Portal</title>
<meta name="description" content="Güncel deneme bonusu veren siteler listesi.">
<style>${CSS.replace(/\s+/g, ' ')}</style>
</head>
<body>
<header><div class="ic"><h1>Deneme Bonusu Veren Siteler</h1><p class="alt">Listedeki bağlantılar kendi yönlendiricimizden geçer.</p></div></header>
<main><div class="ic"><ul>${satirlar}</ul>${blok}</div></main>
<footer><div class="ic">Bilgilendirme amaçlıdır.</div></footer>
</body>
</html>`;
}