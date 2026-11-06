export const SITE_ADLARI = [
  'Bonus Merkezi', 'Deneme Rehberi', 'Bonus Vitrini', 'Bahis Pusulası',
  'Bonus Kılavuzu', 'Deneme Alanı', 'Şans Rehberi', 'Bonus Takip',
  'Deneme Merkezi', 'Bonus Rehberi', 'Bahis Rehberi', 'Bonus Kupon',
  'Deneme Noktası', 'Bonus Gündem', 'Şans Merkezi', 'Bonus Analiz',
  'Deneme Vitrini', 'Bonus Pusula', 'Şans Noktası', 'Bonus Defteri',
  'Deneme Rehberi Plus',
];

export function siteAdi(siteId) {
  if (!siteId) return 'Bonus Liste';
  return SITE_ADLARI[(Number(siteId) - 1) % SITE_ADLARI.length];
}