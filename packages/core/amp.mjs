import { kacis } from './html.mjs';
import { articleLd } from './jsonld.mjs';

const CSS = `
:root{--ana:#6366F1;--ana-koyu:#4F46E5;--zemin:#0F1117;--kart:#171A23;--cizgi:#252A36;--metin:#E8EAEF;--soluk:#9AA1AF}
*{box-sizing:border-box}
body{margin:0;background:var(--zemin);color:var(--metin);font:16px/1.7 -apple-system,"Segoe UI",Roboto,sans-serif}
header{position:sticky;top:0;z-index:5;background:rgba(15,17,23,.94);border-bottom:1px solid var(--cizgi);backdrop-filter:blur(8px)}
.ic{max-width:760px;margin:0 auto;padding:0 18px}
.ust{display:flex;align-items:center;justify-content:space-between;height:56px}
.logo{font-weight:800;letter-spacing:.02em;font-size:1.05rem;color:#fff;text-decoration:none}
.logo span{color:var(--ana)}
.rozet{font-size:.72rem;padding:5px 10px;border:1px solid var(--ana);border-radius:999px;color:var(--ana)}
main{padding:22px 0 56px}
h1{font-size:1.62rem;line-height:1.25;margin:.2em 0 .5em;letter-spacing:-.01em}
h2{font-size:1.24rem;margin:1.8em 0 .6em;padding-top:.2em}
h3{font-size:1.03rem;margin:1.3em 0 .4em;color:#fff}
p{margin:.7em 0}
ul,ol{padding-left:1.25em;margin:.7em 0}
li{margin:.4em 0}
figure{margin:1.4em 0}
amp-img{border-radius:12px;overflow:hidden;border:1px solid var(--cizgi)}
.tablo-sarmal{overflow-x:auto;margin:1em 0;border:1px solid var(--cizgi);border-radius:12px}
table{border-collapse:collapse;width:100%;font-size:.9rem;min-width:560px}
th,td{padding:11px 12px;text-align:left;border-bottom:1px solid var(--cizgi)}
th{background:var(--kart);color:#fff;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em}
tbody tr:last-child td{border-bottom:0}
.tarih{display:inline-flex;align-items:center;gap:7px;font-size:.8rem;color:var(--soluk);background:var(--kart);border:1px solid var(--cizgi);padding:6px 11px;border-radius:999px;margin-bottom:14px}
.nokta{width:7px;height:7px;border-radius:50%;background:#22C55E}
.telif{font-size:.82rem;color:var(--soluk);border-top:1px solid var(--cizgi);padding-top:14px;margin-top:2em}
footer{border-top:1px solid var(--cizgi);padding:22px 0;font-size:.8rem;color:var(--soluk)}
.gizli-blok{display:none}
`;

export function ampSayfa({ d, canonical, baslik, aciklama, govde, modified, ld }) {
  const gorsel = `${canonical.replace(/\/$/, '')}/assets/img/makale-1.svg`;
  return `<!doctype html>
<html ⚡ lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1">
<title>${kacis(baslik)}</title>
<meta name="description" content="${kacis(aciklama)}">
<meta name="robots" content="index, follow, noarchive, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta name="theme-color" content="${kacis(d.ana)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${kacis(baslik)}">
<meta property="og:description" content="${kacis(aciklama)}">
<meta property="og:url" content="${kacis(canonical)}">
<meta property="og:image" content="${kacis(gorsel)}">
<link rel="canonical" href="${kacis(canonical)}">
<link rel="alternate" hreflang="tr" href="${kacis(canonical)}">
<link rel="alternate" hreflang="tr-TR" href="${kacis(canonical)}">
<link rel="alternate" hreflang="x-default" href="${kacis(canonical)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
<style amp-custom>${CSS.replace(/\s+/g, ' ')}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<header><div class="ic ust"><a class="logo" href="/">${kacis(d.ad)}<span>.</span></a><span class="rozet">${kacis(d.rozet)}</span></div></header>
<main><div class="ic">
<div class="tarih"><span class="nokta"></span>Son güncelleme: ${kacis(modified.gorunur)} (${kacis(modified.goreli)})</div>
${govde}
</div></main>
<footer><div class="ic">${kacis(d.ad)} — bağımsız bonus karşılaştırma sayfası.</div></footer>
</body>
</html>`;
}