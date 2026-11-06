export function kacis(metin) {
  return String(metin ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function meta(alanlar) {
  return Object.entries(alanlar)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `<meta name="${kacis(k)}" content="${kacis(v)}">`)
    .join('\n');
}

export function sitemap(yollar, kok, lastmod) {
  const satirlar = yollar
    .map((y) => `  <url><loc>${kacis(kok + y)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${satirlar}\n</urlset>\n`;
}