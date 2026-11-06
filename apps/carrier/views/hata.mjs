import { kacis } from '@ugb/core/html';

const MENU = [
  ['/pages/menu', 'Menu'],
  ['/pages/about', 'About'],
  ['/pages/hours', 'Hours'],
  ['/pages/delivery', 'Delivery'],
  ['/pages/gallery', 'Gallery'],
  ['/pages/contact', 'Contact'],
];

export function hata(d, canonical, kod) {
  const baslik = kod === 404 ? 'Page not found' : 'Something went wrong';
  const aciklama =
    kod === 404
      ? 'The page you were looking for is not on the menu. Use the links below to get back.'
      : 'We are having trouble serving this page right now. Please try again in a moment.';

  const nav = MENU.map(([yol, ad]) => `<a href="${yol}">${ad}</a>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${kod} — ${kacis(d.isim)}</title>
<meta name="robots" content="noindex, follow">
<meta name="theme-color" content="#8c3b26">
<link rel="canonical" href="${kacis(canonical)}">
<style>
*{box-sizing:border-box}
body{margin:0;background:#f7f2ea;color:#2b2118;font:17px/1.7 Georgia,"Times New Roman",serif}
header{background:#8c3b26;color:#f7f2ea}
.ic{max-width:760px;margin:0 auto;padding:0 20px}
.ust{display:flex;align-items:center;justify-content:space-between;min-height:64px;gap:16px;flex-wrap:wrap}
.logo{font-size:1.15rem;font-weight:700;letter-spacing:.01em;color:#fff;text-decoration:none}
nav a{color:#f0d9cf;text-decoration:none;font-size:.86rem;margin-left:14px;white-space:nowrap}
nav a:hover{color:#fff;text-decoration:underline}
main{padding:64px 0 72px}
.kod{font-size:4.2rem;line-height:1;margin:0;color:#8c3b26;letter-spacing:-.02em}
h1{font-size:1.5rem;margin:.5em 0 .3em}
p{max-width:52ch;margin:.6em 0}
.kutu{margin-top:28px;padding:18px 20px;border:1px solid #ddd0bf;border-radius:10px;background:#fffaf3}
.kutu b{display:block;margin-bottom:4px}
a.tel{color:#8c3b26}
footer{border-top:1px solid #ddd0bf;padding:22px 0;font-size:.84rem;color:#6f6152}
</style>
</head>
<body>
<header><div class="ic ust"><a class="logo" href="/">${kacis(d.isim)}</a><nav>${nav}</nav></div></header>
<main><div class="ic">
<p class="kod">${kod}</p>
<h1>${baslik}</h1>
<p>${aciklama}</p>
<div class="kutu">
  <b>${kacis(d.isim)}</b>
  ${kacis(d.adres)}, ${kacis(d.sehir)} ${kacis(d.bolge)} ${kacis(d.posta)}<br>
  <a class="tel" href="tel:${kacis(String(d.tel).replace(/[^0-9+]/g, ''))}">${kacis(d.tel)}</a>
</div>
</div></main>
<footer><div class="ic">${kacis(d.isim)} — ${kacis(d.tur)} · ${kacis(d.sehir)}, ${kacis(d.bolge)}</div></footer>
</body>
</html>`;
}