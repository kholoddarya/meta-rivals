// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint'
  ],

  // Приватные ключи видны только на сервере (Nitro), public — доступны и на клиенте.
  // Реальные значения кладём в .env, сюда — только дефолты/ссылки на env.
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    googleSheetsId: process.env.GOOGLE_SHEETS_ID,
    public: {
      appName: 'MetaRivals'
    }
  }
})
