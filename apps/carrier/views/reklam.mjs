import { kacis } from '@ugb/core/html';

const VARSAYILAN_ANA = '#F59E0B';

const CSS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:#0B0D12;color:#fff;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding-bottom:132px}
.ic{max-width:640px;margin:0 auto;padding:0 8px}
.gizle{display:none!important}

.ustbar{position:sticky;top:0;z-index:40;background:linear-gradient(90deg,color-mix(in srgb,var(--ana) 70%,#000),color-mix(in srgb,var(--ana) 42%,#000));box-shadow:0 6px 20px -10px #000}
.ustbar a{display:flex;align-items:center;gap:10px;height:46px;padding:0 10px;text-decoration:none;color:#fff}
.ustbar .ikn{width:28px;height:28px;flex:0 0 28px;border-radius:50%;background:rgba(255,255,255,.16);display:grid;place-items:center;font-size:14px}
.ustbar .ad{flex:1;min-width:0;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ustbar .cta{flex:0 0 auto;height:28px;padding:0 11px;border-radius:999px;background:#fff;color:#1A1205;font-size:11px;font-weight:800;display:flex;align-items:center;gap:4px;text-transform:uppercase;letter-spacing:.02em}

.ara{display:flex;align-items:center;gap:8px;height:40px;margin-top:8px;padding:0 8px;border-radius:12px;border:1px solid #2E3646;background:#12161F}
.ara svg{flex:0 0 15px;color:var(--ana)}
.ara input{flex:1;min-width:0;background:none;border:0;outline:none;color:#fff;font:13px system-ui}
.ara input::placeholder{color:#8B95A5}
.sayi{flex:0 0 auto;font-size:10.5px;font-weight:700;color:#C7CFDB;border:1px solid #232A38;background:#161B26;padding:3px 6px;border-radius:6px;font-variant-numeric:tabular-nums}
.sayi b{color:var(--ana)}

.cipler{display:flex;gap:6px;overflow-x:auto;padding:8px 0;scrollbar-width:none;-webkit-mask-image:linear-gradient(90deg,#000 92%,transparent);mask-image:linear-gradient(90deg,#000 92%,transparent)}
.cipler::-webkit-scrollbar{display:none}
.cip{flex:0 0 auto;height:32px;padding:0 11px;border-radius:9px;border:1px solid #232A38;background:#12161F;color:#C7CFDB;font:700 12px system-ui;display:flex;align-items:center;gap:6px;cursor:pointer}
.cip[aria-pressed="true"]{background:linear-gradient(135deg,var(--ana),color-mix(in srgb,var(--ana) 70%,#000));border-color:transparent;color:#111}
.cip b{min-width:18px;height:18px;padding:0 5px;border-radius:5px;background:rgba(255,255,255,.22);font-size:10px;display:grid;place-items:center;font-variant-numeric:tabular-nums}
.cip[aria-pressed="true"] b{background:rgba(0,0,0,.18)}

h2{display:flex;align-items:center;gap:6px;margin:12px 0 6px;font-size:13.5px;font-weight:800}
h2 svg{color:var(--ana);flex:0 0 15px}
h2 span{margin-left:auto;font-size:10.5px;font-weight:600;color:#8B95A5}

.banner{position:relative;display:flex;flex-direction:column;justify-content:center;overflow:hidden;aspect-ratio:600/180;margin-bottom:6px;padding:12px 14px;border-radius:14px;border:1px solid color-mix(in srgb,var(--ana) 45%,transparent);text-decoration:none;color:#fff;background:radial-gradient(120% 130% at 0% 0%,color-mix(in srgb,var(--ana) 30%,transparent),transparent 62%),#161B26}
.banner b{font-size:16px;font-weight:800;line-height:1.2}
.banner span{margin-top:2px;font-size:11.5px;color:#C7CFDB;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.banner i{margin-top:8px;align-self:flex-start;font-style:normal;font-size:11px;font-weight:800;padding:5px 13px;border-radius:999px;background:linear-gradient(135deg,var(--ana),color-mix(in srgb,var(--ana) 70%,#000));color:#111}

.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.kart{display:flex;flex-direction:column;gap:5px;padding:6px 6px 7px;border-radius:14px;border:1px solid color-mix(in srgb,var(--ana) 32%,transparent);text-decoration:none;color:inherit;background:radial-gradient(120% 100% at 50% 0%,color-mix(in srgb,var(--ana) 15%,transparent),transparent 70%),#161B26}
.kart .kut{aspect-ratio:3/1;border-radius:9px;display:grid;place-items:center;padding:0 4px;text-align:center;font-size:11px;font-weight:800;line-height:1.15;color:#fff;overflow:hidden;background:linear-gradient(160deg,color-mix(in srgb,var(--ana) 14%,#0E1219),#0E1219)}
.kart b{display:block;font-size:12px;font-weight:800;line-height:1.2;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:linear-gradient(90deg,var(--ana),#fff 55%,var(--ana));-webkit-background-clip:text;background-clip:text;color:transparent}
.kart small{display:block;font-size:9.5px;line-height:1.2;color:#8B95A5;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kart .btn{margin-top:auto;height:26px;border-radius:8px;display:grid;place-items:center;font-size:11px;font-weight:800;background:linear-gradient(135deg,var(--ana),color-mix(in srgb,var(--ana) 70%,#000));color:#111}

.bos{margin:14px 0;padding:18px 12px;border:1px dashed #2E3646;border-radius:12px;text-align:center;color:#8B95A5;font-size:12.5px}

.metin{margin:8px 0;font-size:12.5px;line-height:1.65;color:#A9B2C0}
.dikkat{margin:8px 0;padding:11px 13px;border:1px solid #232A38;border-radius:12px;background:#12161F}
.dikkat ul{margin:0;padding-left:16px}
.dikkat li{margin:4px 0;font-size:12px;color:#A9B2C0}

footer{margin-top:20px;padding:16px 0 4px;border-top:1px solid #1B212C;color:#7C8492;font-size:11px;line-height:1.6}

nav.alt{position:fixed;left:0;right:0;bottom:0;z-index:45;max-width:640px;margin:0 auto;display:grid;grid-template-columns:repeat(5,1fr);height:54px;padding-bottom:env(safe-area-inset-bottom);border-top:1px solid #2E3646;border-radius:14px 14px 0 0;background:rgba(11,13,18,.94);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
nav.alt button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:0;background:none;padding:0;color:#8B95A5;font:600 10px system-ui}
nav.alt button.on{color:#fff}
nav.alt button.orta span.top{position:absolute;top:-18px;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;border:4px solid #0B0D12;background:linear-gradient(135deg,var(--ana),color-mix(in srgb,var(--ana) 70%,#000));color:#111}
nav.alt button.orta span.lbl{padding-top:22px}

.toast{position:fixed;left:0;right:0;bottom:110px;z-index:44;display:flex;justify-content:center;padding:0 10px;pointer-events:none}
.toast .kutu{position:relative;display:flex;align-items:center;gap:9px;width:100%;max-width:312px;padding:7px 30px 7px 8px;border-radius:14px;border:1px solid color-mix(in srgb,var(--ana) 40%,transparent);background:rgba(22,27,38,.94);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);text-decoration:none;color:inherit;overflow:hidden;pointer-events:auto;box-shadow:0 10px 28px -8px rgba(0,0,0,.55)}
.toast .ikn{width:30px;height:30px;flex:0 0 30px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--ana) 18%,transparent);border:1px solid color-mix(in srgb,var(--ana) 35%,transparent);color:var(--ana);font-size:14px}
.toast .gov{flex:1;min-width:0}
.toast .ust{display:block;font-size:10.5px;color:#8B95A5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.toast .ust b{color:#C7CFDB}
.toast .alt{display:block;font-size:13.5px;font-weight:800;color:var(--ana);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.toast .alt i{font-style:normal;font-size:10.5px;font-weight:600;color:#8B95A5}
.toast .bar{position:absolute;left:0;right:0;bottom:0;height:2px;background:rgba(255,255,255,.06)}
.toast .bar span{display:block;height:100%;transform-origin:left;background:linear-gradient(90deg,color-mix(in srgb,var(--ana) 70%,#000),var(--ana))}
.toast .kapat{position:absolute;top:50%;right:5px;transform:translateY(-50%);width:24px;height:24px;display:grid;place-items:center;border-radius:50%;color:rgba(255,255,255,.5);font-size:12px;cursor:pointer}
.toast .kapat:focus-visible{outline:2px solid var(--ana);outline-offset:1px}
@keyframes ilerle{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@media (prefers-reduced-motion:reduce){.toast .bar span{animation:none!important}}
`;

function jsonGuvenli(deger) {
  return JSON.stringify(deger).replace(/</g, '\\u003c');
}

export function reklam({ d, markalar, canonical }) {
  const liste = (markalar ?? []).slice(0, 60);
  const ana = d?.ana || VARSAYILAN_ANA;

  const en = liste[0];
  const premium = liste.slice(0, 4);
  const trendAdet = Math.max(0, liste.length - premium.length);

  const bannerlar = premium
    .map(
      (m) =>
        `<a class="banner" href="/l/${kacis(m.slug)}"><b>${kacis(m.ad)}</b><span>${kacis(m.teklif ?? 'Deneme bonusu')}</span><i>Bonusu Al</i></a>`
    )
    .join('');

  const kartlar = liste
    .map((m, i) => {
      const grup = i < premium.length ? 'premium' : 'trend';
      return `<a class="kart" data-g="${grup}" data-a="${kacis(`${m.ad} ${m.teklif ?? ''}`.toLowerCase())}" href="/l/${kacis(m.slug)}"><span class="kut">${kacis(m.ad)}</span><b>${kacis(m.teklif ?? 'Deneme bonusu')}</b><small>${kacis(m.ad)}</small><span class="btn">Bonusu Al</span></a>`;
    })
    .join('');

  const havuz = liste.map((m) => ({ a: m.ad, t: m.teklif ?? 'Deneme bonusu', s: m.slug }));

  const ustBar = en
    ? `<a href="/l/${kacis(en.slug)}"><span class="ikn">★</span><span class="ad">${kacis(en.ad)} — ${kacis(en.teklif ?? 'Deneme bonusu')}</span><span class="cta">Bonusu Al ›</span></a>`
    : `<a href="/"><span class="ikn">★</span><span class="ad">Güncel bonus listesi</span><span class="cta">Aç ›</span></a>`;

  return `<!doctype html>
<html lang="tr" style="--ana:${kacis(ana)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Deneme Bonusu Veren Siteler 2026 — Güncel Liste</title>
<meta name="description" content="2026 güncel deneme bonusu listesi. Yatırımsız ve çevrimsiz kampanyalar; çevrim şartı, çekim limiti ve doğrulama adımlarıyla birlikte.">
<meta name="robots" content="index, follow, noarchive">
<meta name="theme-color" content="${kacis(ana)}">
<link rel="canonical" href="${kacis(canonical)}">
<style>${CSS}</style>
</head>
<body>

<div class="ustbar">${ustBar}</div>

<main class="ic">
  <div class="ara">
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/></svg>
    <input id="ara" type="search" inputmode="search" placeholder="Site veya bonus ara…" aria-label="Site veya bonus ara">
    <span class="sayi"><b id="sayi">${liste.length}</b> site</span>
  </div>

  <div class="cipler" role="group" aria-label="Liste filtresi" id="cipler">
    <button class="cip" data-m="hepsi" aria-pressed="true" type="button">Tümü <b>${liste.length}</b></button>
    <button class="cip" data-m="trend" aria-pressed="false" type="button">Trend Siteler <b>${trendAdet}</b></button>
    <button class="cip" data-m="premium" aria-pressed="false" type="button">Premium Siteler <b>${premium.length}</b></button>
  </div>

  <section id="premium">
    <h2><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2 9 9l-7 .6 5.3 4.7L5.6 22 12 18.3 18.4 22l-1.7-7.7L22 9.6 15 9z"/></svg>Premium Siteler</h2>
    ${bannerlar}
  </section>

  <section>
    <h2><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>Trend Siteler<span>${liste.length} site</span></h2>
    <div class="grid" id="grid">${kartlar}</div>
    <div class="bos gizle" id="bos">Aramanla eşleşen site yok. Filtreyi “Tümü” yap veya adı kısalt.</div>
  </section>

  <p class="metin">Liste, 2026 itibarıyla aktif kampanya yayınlayan sitelerden oluşuyor. Sıralama; bonus tutarı, çevrim şartı, çekim limiti ve doğrulama süresi birlikte değerlendirilerek yapılır. Üstteki premium alan, kampanyası güncel ve şartları görece hafif olan sitelere ayrılır.</p>

  <p class="metin">Her satırdaki “Bonusu Al” butonu ilgili sitenin kampanya sayfasına gider. Açılan sayfada bonusun geçerlilik tarihi, çevrim katı ve çekim üst limiti yazılıdır; üyelik öncesi bu üç maddeyi oku. Kampanyalar siteler tarafından haber verilmeden kaldırılabilir, bu yüzden tutar sütununu tarihle birlikte değerlendir.</p>

  <div class="dikkat">
    <ul>
      <li>Deneme bonusu genelde tek hesap içindir; aynı kimlikle ikinci hesap açmak bonusu düşürür.</li>
      <li>Çevrim tamamlanmadan yapılan çekim talebi bonusu ve bonusla gelen kazancı silebilir.</li>
      <li>Çekim öncesi kimlik ve adres doğrulaması istenebilir; bunu baştan bilerek ilerle.</li>
      <li>Havale ve kripto yatırımlarında alt sınır siteye göre değişir, tutar sütunundaki notu oku.</li>
    </ul>
  </div>

  <footer>
    ${kacis(d?.ad ?? 'Deneme Bonusu')} · Güncelleme: ${kacis(d?.tarih ?? '')}<br>
    Bu sayfa bilgilendirme amaçlıdır, bahis sitesi değildir. Bonus şartları ilgili sitenin sorumluluğundadır. 18 yaş sınırı vardır.
  </footer>
</main>

<nav class="alt">
  <button type="button" class="on" data-git="hepsi" aria-current="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3z"/></svg>Anasayfa</button>
  <button type="button" data-git="premium"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/></svg>Oyun Seçici</button>
  <button type="button" class="orta" data-git="ust"><span class="top"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2 1.4 5.9L19 12l-5.6 2.1L12 20l-1.4-5.9L5 12l5.6-2.1z"/></svg></span><span class="lbl">Çark</span></button>
  <button type="button" data-git="trend"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M3 6h18v5a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/></svg>Çekilişler</button>
  <button type="button" data-git="alt"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M4 4h16v12H8l-4 4z"/></svg>İletişim</button>
</nav>

<div class="toast" id="toast" aria-live="polite">
  <a class="kutu" id="toastLink" href="/">
    <span class="ikn">★</span>
    <span class="gov">
      <span class="ust"><b id="tKim">ze****79</b> • <span id="tAd">—</span></span>
      <span class="alt" id="tTutar">— <i>kazandı</i></span>
    </span>
    <span class="bar"><span id="tBar"></span></span>
    <span class="kapat" id="toastKapat" role="button" tabindex="0" aria-label="Kapat">✕</span>
  </a>
</div>

<script>
(function () {
  var havuz = ${jsonGuvenli(havuz)};
  var ara = document.getElementById('ara');
  var sayi = document.getElementById('sayi');
  var cipler = [].slice.call(document.querySelectorAll('.cip'));
  var kartlar = [].slice.call(document.querySelectorAll('.kart'));
  var premiumBolum = document.getElementById('premium');
  var grid = document.getElementById('grid');
  var bos = document.getElementById('bos');
  var mod = 'hepsi';

  function uygula() {
    var q = ara.value.trim().toLowerCase();
    var gorunen = 0;
    kartlar.forEach(function (k) {
      var uygun = (mod === 'hepsi' || k.getAttribute('data-g') === mod) && (!q || k.getAttribute('data-a').indexOf(q) > -1);
      k.classList.toggle('gizle', !uygun);
      if (uygun) gorunen++;
    });
    var pGorun = mod === 'hepsi' && !q && premiumBolum.querySelector('.banner');
    premiumBolum.classList.toggle('gizle', !pGorun);
    grid.classList.toggle('gizle', gorunen === 0);
    bos.classList.toggle('gizle', gorunen > 0 || !!pGorun);
    sayi.textContent = String(gorunen);
  }

  function sec(yeni) {
    mod = yeni;
    cipler.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-m') === yeni)); });
    uygula();
  }

  cipler.forEach(function (c) {
    c.addEventListener('click', function () { sec(c.getAttribute('data-m')); });
  });
  ara.addEventListener('input', uygula);

  function git(hedef) {
    if (hedef === 'ust') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      sec('hepsi');
      return;
    }
    if (hedef === 'alt') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }
    sec(hedef);
    document.getElementById('cipler').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var altlar = [].slice.call(document.querySelectorAll('nav.alt button'));
  altlar.forEach(function (b) {
    b.addEventListener('click', function () {
      altlar.forEach(function (x) {
        x.classList.remove('on');
        x.removeAttribute('aria-current');
      });
      b.classList.add('on');
      b.setAttribute('aria-current', 'true');
      git(b.getAttribute('data-git'));
    });
  });

  if (!havuz.length) {
    document.getElementById('toast').classList.add('gizle');
    return;
  }

  var kimler = ['ze****79', 'mu****42', 'ka****11', 'se****57', 'bu****93', 'ha****26'];
  var kutu = document.getElementById('toast');
  var link = document.getElementById('toastLink');
  var tKim = document.getElementById('tKim');
  var tAd = document.getElementById('tAd');
  var tTutar = document.getElementById('tTutar');
  var tBar = document.getElementById('tBar');
  var kapali = false;
  var sayac;

  function yaz() {
    if (kapali) return;
    var m = havuz[Math.floor(Math.random() * havuz.length)];
    var tutar = (Math.floor(Math.random() * 900) + 120) * 1000;
    tKim.textContent = kimler[Math.floor(Math.random() * kimler.length)];
    tAd.textContent = m.t;
    tTutar.innerHTML = tutar.toLocaleString('tr-TR') + ' ₺ <i>kazandı</i>';
    link.setAttribute('href', '/l/' + m.s);
    tBar.style.animation = 'none';
    void tBar.offsetWidth;
    tBar.style.animation = 'ilerle 5000ms linear forwards';
  }

  function kapat(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    kapali = true;
    clearInterval(sayac);
    kutu.classList.add('gizle');
  }

  var kapatDugme = document.getElementById('toastKapat');
  kapatDugme.addEventListener('click', kapat);
  kapatDugme.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') kapat(e);
  });

  yaz();
  sayac = setInterval(yaz, 5400);
})();
</script>

</body>
</html>`;
}