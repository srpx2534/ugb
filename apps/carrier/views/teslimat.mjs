import { kacis } from '@ugb/core/html';
import { layout } from './layout.mjs';

export function teslimat(d, canonical) {
  const govde = `
<section class="bolum">
  <div class="icerik">
    <h1>Delivery &amp; Takeout</h1>
    <p>We deliver across ${kacis(d.sehir)} and the surrounding neighbourhoods. $25 minimum order.</p>
    <div class="kutular">
      <div class="kutu"><h3>Delivery</h3><p>15:00 - 20:30, about 40 minutes.</p></div>
      <div class="kutu"><h3>Takeout</h3><p>Call ahead, ready in 20 minutes.</p></div>
    </div>
    <p><a class="dugme" href="tel:${kacis(d.tel.replace(/[^\d+]/g, ''))}">Call ${kacis(d.tel)}</a></p>
  </div>
</section>`;
  return layout({ d, aktif: '/pages/delivery', baslik: `Delivery — ${d.isim}`, aciklama: `${d.isim} delivery and takeout`, govde, canonical });
}