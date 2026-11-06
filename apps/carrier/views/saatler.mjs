import { kacis } from '@ugb/core/html';
import { layout } from './layout.mjs';

export function saatler(d, canonical) {
  const satirlar = Object.entries(d.saatler)
    .map(([gun, saat]) => `<tr><th>${kacis(gun)}</th><td>${kacis(saat)}</td></tr>`)
    .join('');
  const govde = `
<section class="bolum">
  <div class="icerik">
    <h1>Opening Hours</h1>
    <table class="saatler">${satirlar}</table>
    <p>The kitchen takes last orders thirty minutes before closing.</p>
  </div>
</section>`;
  return layout({ d, aktif: '/pages/hours', baslik: `Hours — ${d.isim}`, aciklama: `${d.isim} opening hours`, govde, canonical });
}