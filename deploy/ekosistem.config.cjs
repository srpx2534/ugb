const path = require('node:path');

const KOK = path.join(__dirname, '..');

const ortak = {
  cwd: KOK,
  interpreter: 'node',
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',
  max_memory_restart: '400M',
  kill_timeout: 8000,
  merge_logs: true,
  time: true,
  env: {
    NODE_ENV: 'prod',
  },
};

module.exports = {
  apps: [
    {
      ...ortak,
      name: 'ugb-carrier',
      script: 'apps/carrier/server.mjs',
      env: { ...ortak.env, PORT: '3001' },
    },
    {
      ...ortak,
      name: 'ugb-hub',
      script: 'apps/hub/server.mjs',
      env: { ...ortak.env, PORT: '3002' },
    },
    {
      ...ortak,
      name: 'ugb-spoke',
      script: 'apps/spoke/server.mjs',
      env: { ...ortak.env, PORT: '3003', SITE_ID: '1' },
    },
  ],
};