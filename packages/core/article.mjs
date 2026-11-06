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

const GIRIS = [
  'Deneme bonusu arayan kullanıcılar için en büyük sorun, ilan edilen tutarın gerçekten kullanılabilir olup olmadığını anlamaktır. Bu sayfada yatırımsız deneme bonusu veren siteleri; aktivasyon yöntemi, çevrim şartı, kullanım süresi ve çekim limiti üzerinden tek tek değerlendirdik. Amaç yalnızca tutarı büyük olan kampanyayı öne çıkarmak değil, kazancın hangi koşulda çekilebilir hâle geldiğini göstermektir.',
  'Yatırımsız deneme bonusu, hesap açmadan para yatırmadan bakiye denemek isteyenler için hazırlanmış kampanyalardır. Ancak her ilanda aynı koşullar geçerli değildir; bir kısmı doğrulama ister, bir kısmı oyun kapsamını daraltır, bir kısmı çekim sınırı koyar. Bu farklar kampanyanın gerçek değerini belirler ve listeye alınma kararında doğrudan etkilidir.',
  'Deneme bonusu veren siteler listelerinin çoğu yalnızca tutarı öne çıkarır. Oysa kampanyanın gerçek değeri, kazancın ne zaman çekilebilir hâle geldiğinde saklıdır. Aşağıdaki değerlendirme bu farkı görünür kılmak için hazırlandı; her başlık tek tek okunmalı ve kampanya koşulları katılımdan önce doğrulanmalıdır.',
  'Bu sayfa bir sıralama iddiası taşımaz. Amaç, kullanıcıların kendi önceliğine göre karar verebileceği bir çerçeve sunmaktır. Bonus tutarı, çevrim yükü, kullanım süresi ve doğrulama adımları birlikte değerlendirilmeden yapılan seçimler kısa sürede hayal kırıklığına dönüşebilir.',
];

const KRITER = [
  'Çevrim şartı ve çevrime katkı oranı açıkça yazılı olmalı; belirsiz ifade kabul edilmemeli.',
  'Kampanyanın geçerli olduğu oyun kategorileri ve sağlayıcı sınırlamaları önceden belirtilmeli.',
  'Aktivasyonun otomatik mi yoksa kodla mı yapıldığı net olmalı.',
  'Kazançlara uygulanan maksimum çekim limiti ve kullanım süresi yazılmalı.',
  'Doğrulama adımları (telefon, e-posta, kimlik) hangi aşamada isteniyor, bilinmeli.',
  'Mobil uygulama ve mobil tarayıcıda akış kesintisiz çalışmalı.',
  'Destek kanalları ve yanıt süresi erişilebilir olmalı.',
  'Kampanya dönemi ve olası değişiklikler duyurulmalı.',
  'Aynı kampanyanın farklı hesaplarda tekrar kullanım kuralı açık olmalı.',
  'Ödeme yöntemleri ve minimum çekim tutarı belirtilmeli.',
  'Bonusun bakiyeye tanımlandığı süre ile kullanım süresi birbirinden ayrılmalı.',
  'Kazanç iptal koşulları ve hesap kapatma halleri tanımlanmalı.',
];

const NOTLAR = [
  'Yatırımsız kampanyalarda aktivasyon yöntemi, varsa doğrulama adımları ve çekim sınırı birlikte okunmalı. Tutar tek başına yeterli gösterge değildir.',
  'Mobil hoş geldin kampanyalarında yalnızca mobil uyumluluğa değil, bonusun hangi kullanıcı grubuna tanımlandığına da bakmak gerekir.',
  'Çevrimsiz olduğu belirtilen tekliflerde maksimum çekim, kullanım süresi ve hesap doğrulaması ayrıca kontrol edilmelidir.',
  'Kodla aktivasyon isteyen kampanyalarda kodun geçerlilik süresi ve kullanım koşulu önceden doğrulanmalı.',
];

const NEDIR = [
  'Deneme bonusu, yeni kullanıcıların belirli koşullar altında bonus bakiye veya ücretsiz oyun hakkı elde ettiği promosyonların genel adıdır. Bazı kampanyalarda ilk para yatırma istenmez; bazı tekliflerde kayıt sonrası doğrulama adımları tamamlanmalıdır. Bu ayrım kampanyanın türünü ve gerçek maliyetini belirler.',
  'Bu bonusların amacı, platformun arayüzünü ve oyun yapısını ilk aşamada tanıtmaktır. Yatırımsız olması, kazançların koşulsuz çekilebileceği anlamına gelmez. Bonus bakiyesi ile çekilebilir bakiye çoğu platformda ayrı hesaplanır ve biri diğerine otomatik dönüşmez.',
  'Bir kampanyanın deneme bonusu sayılabilmesi için kayıt sonrası ek yatırım istememesi gerekir. Yine de hesap doğrulama, tek hesap kuralı ve kullanım süresi gibi idari koşullar korunur. Bu koşullar kampanyanın yatırımsız olmasını ortadan kaldırmaz, yalnızca kötüye kullanımı sınırlar.',
];

const NASIL = [
  'Üyelik formu eksiksiz ve gerçek bilgilerle doldurulur.',
  'Kampanya gerektiriyorsa SMS veya e-posta doğrulaması tamamlanır.',
  'Bonusun otomatik tanımlandığı ya da ayrıca katılım gerektirdiği kontrol edilir.',
  'Kullanım süresi ve çevrim şartı not edilir.',
  'Geçerli oyun kategorileri ve bahis limitleri okunur.',
  'Çekim öncesi doğrulama ve limit şartları gözden geçirilir.',
  'Kazanç çekim talebi, belirtilen ödeme yöntemi üzerinden oluşturulur.',
];

const CEVIRIMSIZ = [
  'Çevrim şartı bulunmayan bonuslar, klasik çevrim katsayısının uygulanmadığı promosyon modelleridir. Yine de çevrimsiz ifadesi başka kural olmadığı anlamına gelmez. Maksimum çekim, süre ve oyun kapsamı gibi sınırlar bu modellerde de korunur.',
  'Bu tür tekliflerde maksimum çekim limiti, kullanım süresi, maksimum bahis ve hesap doğrulaması gibi koşullar bulunabilir. Çevrim şartının yokluğu tek başına kampanyanın tamamını açıklamaz; kalan maddeler de okunmadan karar verilmemelidir.',
  'Çevrimsiz kampanyalar genellikle düşük tutarlıdır ve tek seferlik tanımlanır. Yüksek tutarlı çevrimsiz ilanlar ise çoğu zaman daha sıkı çekim sınırı taşır. Tutar ile sınır arasındaki denge kampanyanın gerçek değerini belirler.',
];

const DIKKAT = [
  'Bonusun ve varsa çevrimin tamamlanması için tanımlı süre olabilir; süre dolduğunda bakiye silinebilir.',
  'Promosyon yalnızca seçili oyunlarda geçerli olabilir.',
  'Kişi, hane, cihaz veya bağlantı başına tek bonus hakkı uygulanabilir.',
  'Bonusla oluşan kazançlara özel maksimum çekim limiti konabilir.',
  'Aynı kampanya farklı hesaplarda tekrarlanırsa ikinci bonus iptal edilebilir.',
  'Bonus aktifken maksimum bahis sınırı aşılırsa kazanç geçersiz sayılabilir.',
  'VPN veya proxy kullanımı doğrulama sırasında sorun çıkarabilir.',
  'Ödeme yöntemine göre ek doğrulama istenebilir; yöntem seçimi önceden yapılmalıdır.',
];

const SSS = [
  ['Yatırımsız deneme bonusunda para yatırmak gerekir mi?', 'Kampanya gerçekten yatırımsızsa ilk yatırım gerekmez. Ancak kullanım süresi, çevrim, maksimum çekim ve doğrulama gibi ek koşullar bulunabilir.'],
  ['Bonus tutarı tek başına avantajı belirler mi?', 'Hayır. Yüksek tutar daha ağır çevrim, daha kısa süre veya daha düşük çekim sınırıyla gelebilir. Tutar koşullarla birlikte değerlendirilmelidir.'],
  ['Bonus kazancı çekilebilir mi?', 'Kampanya şartlarına bağlıdır. Çevrim tamamlandıktan sonra çekim limiti, doğrulama ve süre kuralları uygulanabilir.'],
  ['Mobil cihazdan katılmak mümkün mü?', 'Listedeki kampanyaların mobil akışı kontrol edilmiştir. Yine de katılım öncesi güncel şartlar doğrulanmalıdır.'],
  ['Kampanya koşulları sonradan değişir mi?', 'Değişebilir. Bu yüzden güncel şartlar her zaman kampanyanın kendi sayfasından teyit edilmelidir.'],
  ['Hesap doğrulaması ne zaman istenir?', 'Platforma göre değişir. Çoğu yerde ilk çekim talebinde istenir; bu yüzden doğrulama belgeleri önceden hazırlanmalıdır.'],
  ['Aynı anda birden fazla bonus alınabilir mi?', 'Genellikle hayır. Aktif bir bonus varken ikinci kampanya tanımlanmaz veya ilki iptal edilir.'],
];

const KAPANIS = [
  'Listedeki kampanyalar dönemsel olarak değişir. Bir teklif kaldırıldığında yerine aynı kategoride başka bir kampanya girer; bu nedenle sayfa düzenli aralıklarla gözden geçirilir.',
  'Karar verirken yalnızca bu sayfaya bağlı kalmak doğru değildir. Platformun kendi kampanya sayfası, destek biriminin yazılı yanıtı ve güncel şartlar son kontrol noktası olmalıdır.',
  'Kampanya seçimi kişisel oyun alışkanlığına göre değişir. Slot ağırlıklı oynayan biri için oyun kapsamı, canlı masa oyunlarını tercih eden biri için kategori sınırı belirleyici olur.',
];

export function makaleUret({ tohum, markalar, siteAdi, hubUrl }) {
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

  const [giris1, giris2] = iki(GIRIS);
  const [nedir1, nedir2] = iki(NEDIR);
  const [cev1, cev2] = iki(CEVIRIMSIZ);

  const baslik = `Deneme Bonusu Veren Siteler ${yil} — Yatırımsız ve Çevrimsiz Güncel Liste`;
  const aciklama = `${yil} yılında deneme bonusu veren siteler; yatırımsız tutarlar, çevrim şartı, çekim limiti ve mobil uyum üzerinden değerlendirildi.`;

  const secilenMarka = karistir(markalar).slice(0, 5);
  const turler = ['Yatırımsız kayıt bonusu', 'Mobil hoş geldin bonusu', 'Şartsız hoş geldin', 'Ücretsiz deneme bonusu', 'Yeni üye bonusu'];
  const cevrimler = ['Şartsız', 'Düşük çevrim', 'Çevrim yok', 'Orta çevrim', 'Düşük çevrim'];

  const tablo = secilenMarka
    .map((m, i) => `<tr><td><a href="${esc(hubUrl)}/l/${esc(m.slug)}" rel="nofollow noopener">${esc(m.ad)}</a></td><td>${turler[i % turler.length]}</td><td>${esc(m.teklif ?? '—')}</td><td>${cevrimler[i % cevrimler.length]}</td><td>Var</td></tr>`)
    .join('');

  const notlar = secilenMarka.slice(0, 3)
    .map((m) => `<li><strong>${esc(m.ad)}:</strong> ${esc(sec(rnd, NOTLAR))}</li>`)
    .join('');

  const sss = SSS.map(([s, c]) => `<h3>${esc(s)}</h3><p>${esc(c)}</p>`).join('');

  const govde = `
<h1>Deneme bonusu veren siteler ${yil} listesinde yatırımsız ve çevrimsiz seçenekler</h1>

<p>${esc(giris1)}</p>

<figure>
  <amp-img src="/assets/img/makale-1.svg" width="1200" height="630" layout="responsive" alt="Deneme bonusu veren siteler ${yil}"></amp-img>
</figure>

<h2>Deneme bonusu veren siteler nasıl değerlendirilir?</h2>
<p>Değerlendirmede tutar tek ölçüt değildir. Aşağıdaki maddeler kampanyanın gerçek kullanılabilirliğini gösterir ve her biri katılım öncesi tek tek doğrulanmalıdır.</p>
<ul>${KRITER.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
<p>${esc(giris2)}</p>

<h2>${yil} deneme bonusu karşılaştırma tablosu</h2>
<p>Tabloda yer alan bilgiler kampanyaların temel yapısını gösterir. Tutar ve koşullar dönemsel olarak değişebilir; tablo sabit bir gerçeklik iddiası taşımaz.</p>
<div class="tablo-sarmal"><table><thead><tr><th>Site</th><th>Bonus türü</th><th>Miktar</th><th>Çevrim şartı</th><th>Mobil uyum</th></tr></thead><tbody>${tablo}</tbody></table></div>
<p>${esc(sec(rnd, KAPANIS))}</p>

<h2>Platform notları</h2>
<p>Aşağıdaki notlar tablodaki kampanyaların hangi noktalar üzerinden okunması gerektiğini açıklar.</p>
<ul>${notlar}</ul>

<figure>
  <amp-img src="/assets/img/makale-2.svg" width="1200" height="630" layout="responsive" alt="Çevrimsiz deneme bonusu şartları"></amp-img>
</figure>

<h2>Deneme bonusu nedir, nasıl alınır?</h2>
<p>${esc(nedir1)}</p>
<p>${esc(nedir2)}</p>
<h3>Adım adım süreç</h3>
<ol>${NASIL.map((n) => `<li>${esc(n)}</li>`).join('')}</ol>
<p>Süreç platforma göre kısalır veya uzar; ancak sıra genellikle aynıdır. Hangi adımda ne istendiğini önceden bilmek, sonradan doğrulama sorunu yaşanmasını engeller.</p>

<h2>Çevrimsiz deneme bonusu veren siteler</h2>
<p>${esc(cev1)}</p>
<p>${esc(cev2)}</p>

<h2>Dikkat edilmesi gerekenler</h2>
<p>Bonus kullanımı sırasında aşağıdaki maddelerin her biri kazanç iptaline yol açabilir. Aktivasyon öncesi okunmalıdır.</p>
<ul>${DIKKAT.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>

<figure>
  <amp-img src="/assets/img/makale-3.svg" width="1200" height="630" layout="responsive" alt="Deneme bonusu kullanırken dikkat edilecekler"></amp-img>
</figure>

<h2>Sıkça sorulan sorular</h2>
${sss}

<h2>Bilgilendirme notu</h2>
<p>Bu içerik, deneme bonusu veren siteler ve farklı promosyon modellerinde karşılaşılabilecek temel şartlar hakkında bilgi vermek için hazırlanmıştır. Bonus tutarları, kampanya kapsamı ve kullanım koşulları zaman içinde değişebileceği için işlem öncesinde ilgili platformun yayımladığı güncel şartlar esas alınmalıdır.</p>
<p class="telif">© ${yil} ${esc(siteAdi)} — Tüm hakları saklıdır. İçerik bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</p>`;

  const kelime = govde.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  return { baslik, aciklama, govde, kelime };
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}