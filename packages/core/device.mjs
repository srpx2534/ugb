const MOBIL = /Mobile|Android|iPhone|iPod|iPad|Tablet|Silk|Kindle|Opera Mini|IEMobile|Windows Phone/i;

export function mobilMi(ua) {
  const u = String(ua ?? '');
  if (!u) return false;
  return MOBIL.test(u);
}