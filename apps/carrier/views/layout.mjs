import { kacis, meta } from '@ugb/core/html';

const SAYFALAR = [
  ['/', 'Home'],
  ['/pages/menu', 'Menu'],
  ['/pages/about', 'About'],
  ['/pages/hours', 'Hours'],
  ['/pages/delivery', 'Delivery'],
  ['/pages/gallery', 'Gallery'],
  ['/pages/contact', 'Contact'],
];

export function layout({ d, aktif, baslik, aciklama, govde, canonical }) {
  const menu = SAYFALAR.map(
    ([yol, ad]) => `<li><a href="${yol}"${yol === aktif ? ' aria-current="page"' : ''}>${ad}</a></li>`
  ).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="WordPress 6.1.1">
<title>${kacis(baslik)}</title>
${meta({ description: aciklama, 'og:title': baslik, 'og:description': aciklama, 'og:type': 'website' })}
${canonical ? `<link rel="canonical" href="${kacis(canonical)}">` : ''}
<link rel="stylesheet" href="/assets/stil.css">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
</head>
<body>
<header class="ust">
  <div class="ust-ic">
    <a class="marka" href="/">${kacis(d.isim)}</a>
    <nav><ul class="menuler">${menu}</ul></nav>
  </div>
</header>
<main>
${govde}
</main>
<footer class="alt">
  <div class="icerik">
    <p><strong>${kacis(d.isim)}</strong> — ${kacis(d.adres)}, ${kacis(d.sehir)}, ${kacis(d.bolge)} ${kacis(d.posta)}</p>
    <p><a href="tel:${kacis(d.tel.replace(/[^\d+]/g, ''))}">${kacis(d.tel)}</a> · <a href="mailto:${kacis(d.eposta)}">${kacis(d.eposta)}</a></p>
    <p>&copy; ${new Date().getFullYear()} ${kacis(d.isim)}. All rights reserved.</p>
  </div>
</footer>
</body>
</html>`;
}