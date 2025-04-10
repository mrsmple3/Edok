module.exports = {
  apps: [
    {
      name: 'NuxtAppName',
      port: '3000',
      exec_mode: 'cluster',
      instances: 'max',
      script: './.output/server/index.mjs',
       env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'mysql://agroedoc_com:ExApY0eBcnGKJkCd@185.69.155.118:3306/agroedoc_com'
      }
    }
  ]
}
