module.exports = {
  apps: [
    {
      name: 'dcip-backend',
      script: 'dist/index.js',
      instances: 1,
      watch: false,
      restart_delay: 3000,
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      env_production: {
        PORT: 5000,
        NODE_ENV: 'production',
      },
    },
  ],
}
