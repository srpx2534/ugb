import { kacis } from '@ugb/core/html';
import { layout } from './layout.mjs';

export function iletisim(d, canonical) {
  const govde = `
<section class="bolum">
  <div class="icerik">
    <h1>Contact</h1>
    <p>${kacis(d.adres)}<br>${kacis(d.sehir)}, ${kacis(d.bolge)} ${kacis(d.posta)}</p>
    <p><a href="tel:${kacis(d.tel.replace(/[^\d+]/g, ''))}">${kacis(d.tel)}</a> · <a href="mailto:${kacis(d.eposta)}">${kacis(d.eposta)}</a></p>
    <form method="post" action="/pages/contact">
      <label for="ad">Name</label>
      <input id="ad" name="ad" required>
      <label for="eposta">Email</label>
      <input id="eposta" name="eposta" type="email" required>
      <label for="mesaj">Message</label>
      <textarea id="mesaj" name="mesaj" rows="5" required></textarea>
      <button class="dugme" type="submit">Send</button>
    </form>
  </div>
</section>`;
  return layout({ d, aktif: '/pages/contact', baslik: `Contact — ${d.isim}`, aciklama: `${d.isim} contact`, govde, canonical });
}