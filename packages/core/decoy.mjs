const VARSAYILAN = {
  isim: 'Rittenhouse Grill',
  tur: 'Kebap & Grill',
  adres: '21258 E Rittenhouse Rd',
  sehir: 'Queen Creek',
  bolge: 'AZ',
  posta: '85142',
  tel: '(480) 555-0134',
  eposta: 'info@rittenhousegrill.example',
  hakkinda:
    'Family owned since 2016. Charcoal-grilled sis kebab, adana and lahmacun, cooked to order. Parking on site, two minutes from Rittenhouse Road.',
  saatler: {
    Monday: '11:00 - 21:00',
    Tuesday: '11:00 - 21:00',
    Wednesday: '11:00 - 21:00',
    Thursday: '11:00 - 21:00',
    Friday: '11:00 - 22:00',
    Saturday: '11:00 - 22:00',
    Sunday: '12:00 - 20:00',
  },
  menu: [
    { ad: 'Adana Kebab', fiyat: '$18' },
    { ad: 'Sis Kebab', fiyat: '$19' },
    { ad: 'Lahmacun', fiyat: '$6' },
    { ad: 'Iskender', fiyat: '$21' },
    { ad: 'Lentil Soup', fiyat: '$5' },
    { ad: 'Baklava', fiyat: '$7' },
  ],
  fotolar: 6,
};

export function decoyCoz(domain) {
  const d = domain?.decoy ?? {};
  return {
    ...VARSAYILAN,
    ...d,
    saatler: { ...VARSAYILAN.saatler, ...(d.saatler ?? {}) },
    menu: Array.isArray(d.menu) && d.menu.length ? d.menu : VARSAYILAN.menu,
    fotolar: Number(d.fotolar ?? VARSAYILAN.fotolar),
  };
}

export function svgYerine(metin, sira) {
  const renkler = ['#8c3b26', '#a9552f', '#6f3320', '#b4693f'];
  const zemin = renkler[sira % renkler.length];
  return `<svg viewBox="0 0 400 300" role="img" aria-label="${metin}"><rect width="400" height="300" fill="${zemin}"/><text x="200" y="155" text-anchor="middle" fill="#f4efe6" font-family="Georgia, serif" font-size="20">${metin}</text></svg>`;
}