import { kacis } from '@ugb/core/html';
import { layout } from './layout.mjs';

export function hakkinda(d, canonical) {
  const govde = `
<section class="bolum">
  <div class="icerik">
    <h1>About Us</h1>
    <p>${kacis(d.isim)} is a family business in ${kacis(d.sehir)}. ${kacis(d.hakkinda)}</p>
    <p>Nothing in our kitchen is frozen. Bread is baked every morning, kebab is prepared when you order it.</p>
    <p>${kacis(d.adres)}, ${kacis(d.sehir)}, ${kacis(d.bolge)} ${kacis(d.posta)}</p>
  </div>
</section>`;
  return layout({ d, aktif: '/pages/about', baslik: `About — ${d.isim}`, aciklama: `About ${d.isim}`, govde, canonical });
}