// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        { src: "/js/eusign.js", type: "text/javascript", },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/Edok.svg' }
      ],
    }
  },
  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@pinia/nuxt', 'nuxt-socket-io'],
  compatibilityDate: '2024-11-01',
  plugins: ['~/plugins/vue-the-mask.ts'],
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  io: {
    sockets: [
      {
        name: 'chat', // Название подключения
        url: 'http://localhost:3000', // URL вашего WebSocket-сервера
      },
    ],
  },
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
  css: ['~/assets/style/main.scss', '~/assets/css/main.css'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/style/_templates.scss" as *;',
        },
        sass: {
          api: "modern",
        },
      },
    },
  },
  runtimeConfig: {
    jwtAccessSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
    public: {
      apiBase: 'http://localhost:3001' // Основное API
    }
  }
})
