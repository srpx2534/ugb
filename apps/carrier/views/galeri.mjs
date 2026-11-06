import { svgYerine } from '@ugb/core/decoy';
import { layout } from './layout.mjs';

export function galeri(d, canonical) {
  const adet = Math.min(Math.max(d.fotolar, 1), 12);
  const kareler = Array.from({ length: adet }, (_, i) => svgYerine(`${d.isim} ${i + 1}`, i)).join('');
  const govde = `
<section class="bolum">
  <div class="icerik">
    <h1>Gallery</h1>
    <p>The room, the grill, the plates.</p>
    <div class="galeri">${kareler}</div>
  </div>
</section>`;
  return layout({ d, aktif: '/pages/gallery', baslik: `Gallery — ${d.isim}`, aciklama: `${d.isim} photos`, govde, canonical });
}