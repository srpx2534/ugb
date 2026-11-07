import { kacis } from '@ugb/core/html';
import { layout } from './layout.mjs';

const GUNLER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ev(d, canonical) {
  const gun = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const bugun = d.saatler?.[gun];
  const rozet = bugun ? `Open today ${bugun}` : 'Closed today';

  const serit = (d.menu ?? [])
    .slice(0, 3)
    .map((s) => `<div class="oge"><span class="ad">${kacis(s.ad)}</span></div>`)
    .join('');

  const saatler = GUNLER
    .filter((g) => d.saatler?.[g])
    .map((g) => `<tr><th>${kacis(g)}</th><td>${kacis(d.saatler[g])}</td></tr>`)
    .join('');

  const govde = `
<section class="hero hero-foto">
  <img src="/assets/img/galeri/2.png" alt="${kacis(d.isim)} dining room" width="1200" height="800">
  <div class="hero-perde">
    <div class="icerik">
      <p class="rozet">${kacis(rozet)}</p>
      <h1>${kacis(d.tur)} in ${kacis(d.sehir)}</h1>
      <p class="alt-metin">Charcoal-grilled sis kebab, adana and lahmacun, cooked to order over open coals. Family owned, easy parking, two minutes from Rittenhouse Road.</p>
      <p class="cift-dugme">
        <a class="dugme" href="/pages/menu">View Menu</a>
        <a class="dugme dugme-bos" href="/pages/contact">Get Directions</a>
      </p>
    </div>
  </div>
</section>

<section class="serit">${serit}</section>

<section class="bolum">
  <div class="icerik">
    <h2>Why ${kacis(d.isim)}</h2>
    <div class="kutular">
      <div class="kutu"><h3>Charcoal Grill</h3><p>Every skewer goes over open coals, cooked to order. Nothing sits under a lamp.</p></div>
      <div class="kutu"><h3>Family Run</h3><p>Same family, same recipes, since 2016. The person at the grill owns the place.</p></div>
      <div class="kutu"><h3>Easy Parking</h3><p>Private lot on Rittenhouse Road, two minutes off the highway.</p></div>
    </div>
  </div>
</section>

<section class="bolum">
  <div class="icerik">
    <h2>What people say</h2>
    <div class="yorumlar">
      <blockquote class="yorum">
        <p>“Adana was properly charred, not steamed. Bread came out warm twice without asking.”</p>
        <cite>— Marcus D., Queen Creek</cite>
      </blockquote>
      <blockquote class="yorum">
        <p>“We come every other Friday. Portions are honest and the staff remembers us.”</p>
        <cite>— Elena R., Gilbert</cite>
      </blockquote>
    </div>
  </div>
</section>

<section class="bolum">
  <div class="icerik">
    <h2>Visit Us</h2>
    <div class="saat-kutu">
      <div>
        <p>${kacis(d.adres)}<br>${kacis(d.sehir)}, ${kacis(d.bolge)} ${kacis(d.posta)}</p>
        <p><a href="tel:${kacis(d.tel.replace(/[^\d+]/g, ''))}">${kacis(d.tel)}</a></p>
        <p><a class="dugme" href="/pages/contact">Get Directions</a></p>
      </div>
      <div>
        <table class="saatler"><tbody>${saatler}</tbody></table>
      </div>
    </div>
  </div>
</section>`;

  return layout({ d, aktif: '/', baslik: `${d.isim} — ${d.tur} in ${d.sehir}, ${d.bolge}`, aciklama: d.hakkinda, govde, canonical });
}