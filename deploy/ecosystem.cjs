module.exports = {
  apps: [
    { name: 'carrier', cwd: '/srv/ugb/apps/carrier', script: 'server.mjs', instances: 1, max_memory_restart: '300M' },
    { name: 'hub', cwd: '/srv/ugb/apps/hub', script: 'server.mjs', instances: 1, max_memory_restart: '200M' },
    { name: 'spoke', cwd: '/srv/ugb/apps/spoke', script: 'server.mjs', instances: 1, max_memory_restart: '200M' },
  ],
};