export const SITE_ADLARI = [
  'Bonus Merkezi', 'Deneme Rehberi', 'Bonus Vitrini', 'Bahis Pusulası',
  'Bonus Kılavuzu', 'Deneme Alanı', 'Şans Rehberi', 'Bonus Takip',
  'Deneme Merkezi', 'Bonus Rehberi', 'Bahis Rehberi', 'Bonus Kupon',
  'Deneme Noktası', 'Bonus Gündem', 'Şans Merkezi', 'Bonus Analiz',
  'Deneme Vitrini', 'Bonus Pusula', 'Şans Noktası', 'Bonus Defteri',
  'Deneme Rehberi Plus',
];

// site_id 1 tabanli; 0, negatif veya sayisiz degerde de gecerli isim doner.
export function siteAdi(siteId) {
  const n = Number(siteId);
  if (!Number.isFinite(n) || n < 1) return 'Bonus Liste';
  return SITE_ADLARI[(Math.trunc(n) - 1) % SITE_ADLARI.length];
}