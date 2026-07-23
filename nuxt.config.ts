export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/ui',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/i18n',
  ],

  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' },
      { code: 'ru', iso: 'ru-RU', file: 'ru.json', name: 'Русский' },
    ],
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classPrefix: '',
  },

  app: {
    head: {
      meta: [
        {
          name: 'coinzilla',
          content: '13fada878dd4db058be3efb2b58bb90a',
        },
      ],
      script: [
        { src: 'https://yandex.ru/ads/system/context.js', async: true },
        {
          'data-page-id': '19640074',
          src: 'https://yandex.ru/ads/system/ap-loader.js',
          async: true,
        },
      ],
      htmlAttrs: {
        class: 'transition-colors duration-300',
      },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/logo.png' }],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    googleApiKey: process.env.NUXT_GOOGLE_API_KEY,
    spreadsheetId: process.env.NUXT_PUBLIC_SPREADSHEET_ID,
    public: {
      appName: 'MetaRivals',
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    },
    nowpaymentsApiKey: process.env.NOWPAYMENTS_API_KEY,
    nowpaymentsIpnKey: process.env.NOWPAYMENTS_IPN_KEY,
  },
})
