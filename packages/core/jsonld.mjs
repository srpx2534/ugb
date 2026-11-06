import { YAYIN } from './freshness.mjs';

export function articleLd({ baslik, aciklama, canonical, gorsel, modified, siteAdi, yayinAdi }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: baslik,
    description: aciklama,
    articleSection: 'Deneme Bonusu',
    keywords: 'deneme bonusu, deneme bonusu veren siteler, yatırımsız deneme bonusu, çevrimsiz bonus',
    about: [
      { '@type': 'Thing', name: 'Deneme Bonusu' },
      { '@type': 'Thing', name: 'Yatırımsız Bonus' },
    ],
    image: [gorsel],
    author: { '@type': 'Organization', name: siteAdi, url: canonical },
    publisher: {
      '@type': 'Organization',
      name: yayinAdi,
      url: canonical,
    },
    inLanguage: 'tr-TR',
    datePublished: YAYIN,
    dateCreated: YAYIN,
    dateModified: modified,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  };
}