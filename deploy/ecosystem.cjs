// PM2 surec grubu. Her uygulama kendi portunda; portlar burada sabit,
// nginx.conf.tpl ayni portlari kullanir. Port .env'den gelmez, boylece
// uc uygulama ayni anahtari paylasip cakismaz.
module.exports = {
  apps: [
    {
      name: 'carrier',
      cwd: '/srv/ugb/apps/carrier',
      script: 'server.mjs',
      instances: 1,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'prod', PORT: '3001' },
    },
    {
      name: 'hub',
      cwd: '/srv/ugb/apps/hub',
      script: 'server.mjs',
      instances: 1,
      max_memory_restart: '200M',
      env: { NODE_ENV: 'prod', PORT: '3002' },
    },
    {
      name: 'spoke',
      cwd: '/srv/ugb/apps/spoke',
      script: 'server.mjs',
      instances: 1,
      max_memory_restart: '200M',
      env: { NODE_ENV: 'prod', PORT: '3003' },
    },
  ],
};