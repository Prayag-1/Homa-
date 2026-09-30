module.exports = {
  apps: [{
    name: 'homa-api',
    script: 'server.js',
    cwd: '/var/www/homa/server',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    error_file: '/var/log/homa/error.log',
    out_file: '/var/log/homa/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    kill_timeout: 5000,
    listen_timeout: 8000,
    wait_ready: true,
  }],
};
