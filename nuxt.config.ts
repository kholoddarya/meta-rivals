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

  css: ['~/assets/css/main.css'],

  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ru', iso: 'ru-RU', name: 'Русский', file: 'ru.json' },
    ],
    langDir: 'locales', // Папка с файлами переводов
    defaultLocale: 'en',
    strategy: 'no_prefix', // URL не будут меняться
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },

  runtimeConfig: {
    googleApiKey: process.env.NUXT_GOOGLE_API_KEY,
    spreadsheetId: process.env.NUXT_PUBLIC_SPREADSHEET_ID,
    public: {
      appName: 'MetaRivals',
    },
  },
})
