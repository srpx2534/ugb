import { kacis } from '@ugb/core/html';

export function panel({ domainler, tiklama }) {
  const satirlar = domainler
    .map((d) => `<tr><td>${kacis(d.host)}</td><td>${kacis(d.role)}</td><td>${d.aktif ? 'açık' : 'kapalı'}</td><td>${tiklama[d.id] ?? 0}</td><td><form method="post" action="/admin/domain/${d.id}/durum"><button>${d.aktif ? 'kapat' : 'aç'}</button></form></td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>Panel</title>
<style>body{font:15px system-ui;background:#0B0D12;color:#E8EAEF;margin:0;padding:24px}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #222733;padding:9px;text-align:left}th{font-size:.75rem;text-transform:uppercase;color:#98A0AE}button{background:#4F46E5;color:#fff;border:0;padding:5px 10px;border-radius:6px;cursor:pointer}</style>
</head><body><h1>Panel</h1><table><thead><tr><th>Host</th><th>Rol</th><th>Durum</th><th>Tıklama</th><th></th></tr></thead><tbody>${satirlar}</tbody></table></body></html>`;
}