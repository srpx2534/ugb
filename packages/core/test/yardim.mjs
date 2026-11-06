import { mulberry32 } from '../article.mjs';

export function tohumlu(n = 1) {
  return mulberry32(n);
}

export function havuz(adet, tur) {
  return Array.from({ length: adet }, (_, i) => ({
    anchor: `${tur}-${i}`,
    hedef: `https://${tur}${i}.ornek/`,
    tur,
  }));
}