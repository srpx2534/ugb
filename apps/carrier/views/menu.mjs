import { kacis } from '@ugb/core/html';
import { layout } from './layout.mjs';

export function menu(d, canonical) {
  const satirlar = d.menu
    .map((m) => `<li><span>${kacis(m.ad)}</span><span class="fiyat">${kacis(m.fiyat)}</span></li>`)
    .join('');
  const govde = `
<section class="bolum">
  <div class="icerik">
    <h1>Menu</h1>
    <p>${kacis(d.hakkinda)}</p>
    <ul class="menu-liste">${satirlar}</ul>
    <p>Prices exclude tax. Menu changes seasonally.</p>
  </div>
</section>`;
  return layout({ d, aktif: '/pages/menu', baslik: `Menu — ${d.isim}`, aciklama: `${d.isim} menu and prices`, govde, canonical });
}