import { dikey } from './dikey.mjs';

export const YIL = 2026;

export function mulberry32(tohum) {
  let a = tohum >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sec(rnd, dizi) {
  return dizi[Math.floor(rnd() * dizi.length)];
}

export function normalize(metin) {
  return String(metin ?? '')
    .replace(/\bHOŞGELDIN\b/gi, 'HOŞ GELDİN')
    .replace(/\bDenene\b/g, 'Deneme')
    .replace(/\bYatirima\b/g, 'Yatırıma')
    .replace(/\bKayıp\s+Bonusu\b/g, 'Kayıp Bonusu')
    .replace(/%\s+(\d)/g, '%$1')
    .replace(/(\d)TL\b/g, '$1 TL')
    .replace(/ {2,}/g, ' ')
    .trim();
}

export function besGram(metin) {
  const k = normalize(metin).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const g = new Set();
  for (let i = 0; i + 5 <= k.length; i++) g.add(k.slice(i, i + 5).join(' '));
  return g;
}

export function ortusmeOrani(a, b) {
  if (!a.size || !b.size) return 0;
  let ortak = 0;
  for (const g of a) if (b.has(g)) ortak++;
  return ortak / a.size;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function makaleUret({ tohum, markalar, siteAdi, hubUrl }) {
  const m = dikey.makale;
  const rnd = mulberry32(tohum);
  const yil = YIL;

  const karistir = (d) => {
    const h = [...d];
    for (let i = h.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [h[i], h[j]] = [h[j], h[i]];
    }
    return h;
  };
  // ayni havuzdan iki farkli paragraf: ust uste ayni metin gelmez
  const iki = (d) => {
    const h = karistir(d);
    return [h[0], h[1] ?? h[0]];
  };

  const [giris1, giris2] = iki(m.giris);
  const [nedir1, nedir2] = iki(m.nedir);
  const [cev1, cev2] = iki(m.alt);

  const baslik = m.baslik;
  const aciklama = m.aciklama;

  const secilenMarka = karistir(markalar).slice(0, 5);

  const tablo = secilenMarka
    .map(
      (x, i) =>
        `<tr><td><a href="${esc(hubUrl)}/l/${esc(x.slug)}" rel="nofollow noopener">${esc(x.ad)}</a></td><td>${esc(m.tur[i % m.tur.length])}</td><td>${esc(x.teklif ?? '—')}</td><td>${esc(m.cevrim[i % m.cevrim.length])}</td><td>${esc(m.sonKolon)}</td></tr>`
    )
    .join('');

  const notlar = secilenMarka
    .slice(0, 3)
    .map((x) => `<li><strong>${esc(x.ad)}:</strong> ${esc(sec(rnd, m.not))}</li>`)
    .join('');

  const sss = m.sss.map(([s, c]) => `<h3>${esc(s)}</h3><p>${esc(c)}</p>`).join('');

  const govde = `
<h1>${esc(m.h1)}</h1>

<p>${esc(giris1)}</p>

<figure>
  <amp-img src="/assets/img/makale-1.svg" width="1200" height="630" layout="responsive" alt="${esc(m.gorselAlt[0])}"></amp-img>
</figure>

<h2>${esc(m.kriterH)}</h2>
<p>${esc(m.kriterG)}</p>
<ul>${m.kriter.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
<p>${esc(giris2)}</p>

<h2>${esc(m.tabloH)}</h2>
<p>${esc(m.tabloG)}</p>
<div class="tablo-sarmal"><table><thead><tr>${m.kolon.map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${tablo}</tbody></table></div>
<p>${esc(sec(rnd, m.kapanis))}</p>

<h2>${esc(m.notH)}</h2>
<p>${esc(m.notG)}</p>
<ul>${notlar}</ul>

<figure>
  <amp-img src="/assets/img/makale-2.svg" width="1200" height="630" layout="responsive" alt="${esc(m.gorselAlt[1])}"></amp-img>
</figure>

<h2>${esc(m.nedirH)}</h2>
<p>${esc(nedir1)}</p>
<p>${esc(nedir2)}</p>
<h3>${esc(m.adimH)}</h3>
<ol>${m.adim.map((n) => `<li>${esc(n)}</li>`).join('')}</ol>
<p>${esc(m.adimSon)}</p>

<h2>${esc(m.altH)}</h2>
<p>${esc(cev1)}</p>
<p>${esc(cev2)}</p>

<h2>${esc(m.dikkatH)}</h2>
<p>${esc(m.dikkatG)}</p>
<ul>${m.dikkat.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>

<figure>
  <amp-img src="/assets/img/makale-3.svg" width="1200" height="630" layout="responsive" alt="${esc(m.gorselAlt[2])}"></amp-img>
</figure>

<h2>${esc(m.sssH)}</h2>
${sss}

<h2>${esc(m.bilgiH)}</h2>
<p>${esc(m.bilgi)}</p>
<p class="telif">© ${yil} ${esc(siteAdi)} — Tüm hakları saklıdır. ${esc(m.telif)}</p>`;

  const kelime = govde.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  return { baslik, aciklama, govde, kelime };
}