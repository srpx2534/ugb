import { kacis } from '@ugb/core/html';
import { layout } from './layout.mjs';

export function ev(d, canonical) {
  const govde = `
<section class="hero">
  <div class="icerik">
    <h1>${kacis(d.tur)} in ${kacis(d.sehir)}</h1>
    <p>Charcoal-grilled kebab, cooked to order. Family owned, easy parking, two minutes from Rittenhouse Road.</p>
    <p><a class="dugme" href="/pages/menu">View Menu</a></p>
  </div>
</section>
<section class="bolum">
  <div class="icerik">
    <h2>Why ${kacis(d.isim)}</h2>
    <div class="kutular">
      <div class="kutu"><h3>Charcoal Grill</h3><p>Every skewer goes over open coals, cooked to order.</p></div>
      <div class="kutu"><h3>Family Run</h3><p>Same family, same recipes, since 2016.</p></div>
      <div class="kutu"><h3>Easy Parking</h3><p>Private lot on Rittenhouse Road.</p></div>
    </div>
  </div>
</section>
<section class="bolum">
  <div class="icerik">
    <h2>Visit Us</h2>
    <p>${kacis(d.adres)}, ${kacis(d.sehir)}, ${kacis(d.bolge)} ${kacis(d.posta)}</p>
    <p><a class="dugme" href="/pages/contact">Get Directions</a></p>
  </div>
</section>`;
  return layout({ d, aktif: '/', baslik: `${d.isim} — ${d.tur} in ${d.sehir}, ${d.bolge}`, aciklama: d.hakkinda, govde, canonical });
}