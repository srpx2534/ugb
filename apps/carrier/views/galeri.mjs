import { svgYerine } from '@ugb/core/decoy';
import { layout } from './layout.mjs';

const FOTO = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];

export function galeri(d, canonical) {
  const adet = Math.min(Math.max(d.fotolar, 1), FOTO.length);
  const kareler = Array.from({ length: adet }, (_, i) => {
    const dosya = FOTO[i % FOTO.length];
    return `<img src="/assets/img/galeri/${dosya}" alt="${d.isim} ${i + 1}" width="400" height="300" loading="lazy">`;
  }).join('');

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