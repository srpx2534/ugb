// PM2 surec grubu. Portlar .env'den okunur, kodda sabit port yok.
// Disariya 80'i nginx acar; buradaki portlar yalnizca 127.0.0.1 icindir.
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const port = (ad) => {
  const deger = process.env[ad];
  if (!deger) throw new Error(`[ecosystem] ${ad} tanimli degil`);
  return String(deger);
};

module.exports = {
  apps: [
    {
      name: 'carrier',
      cwd: '/srv/ugb/apps/carrier',
      script: 'server.mjs',
      instances: 1,
      max_memory_restart: '300M',
      kill_timeout: 8000,
      env: { NODE_ENV: 'prod', PORT: port('CARRIER_PORT') },
    },
    {
      name: 'hub',
      cwd: '/srv/ugb/apps/hub',
      script: 'server.mjs',
      instances: 1,
      max_memory_restart: '200M',
      kill_timeout: 8000,
      env: { NODE_ENV: 'prod', PORT: port('HUB_PORT') },
    },
    {
      name: 'spoke',
      cwd: '/srv/ugb/apps/spoke',
      script: 'server.mjs',
      instances: 1,
      max_memory_restart: '200M',
      kill_timeout: 8000,
      env: { NODE_ENV: 'prod', PORT: port('SPOKE_PORT') },
    },
  ],
};