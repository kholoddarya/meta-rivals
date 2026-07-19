<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
    <div class="max-w-7xl mx-auto">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Marvel Rivals: База данных</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Синхронизировано с Google Sheets</p>
      </header>

      <!-- Состояние загрузки -->
      <div
        v-if="store.isLoading"
        class="flex flex-col items-center justify-center py-20 text-gray-500"
      >
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mb-4"></div>
        <p>Загрузка данных из таблиц...</p>
      </div>

      <!-- Состояние ошибки -->
      <div
        v-else-if="store.error"
        class="p-4 mb-6 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800"
      >
        {{ store.error }}
      </div>

      <!-- Основной контент -->
      <div v-else class="flex flex-col gap-6">
        <!-- Две колонки 50%-50% -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="flex flex-col">
            <h2
              class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"
            >
              <span class="w-2 h-6 bg-red-600 rounded-full"></span>
              Полная информация (FullInfo)
            </h2>
            <AppDataTable :data="store.fullInfo" />
          </div>

          <div class="flex flex-col">
            <h2
              class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"
            >
              <span class="w-2 h-6 bg-blue-600 rounded-full"></span>
              Тир-лист героев (HeroTier)
            </h2>
            <AppDataTable :data="store.heroTier" />
          </div>
        </div>

        <!-- Секция на всю ширину контейнера -->
        <div class="flex flex-col">
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"
          >
            <span class="w-2 h-6 bg-yellow-500 rounded-full"></span>
            Классы (Class)
          </h2>
          <AppDataTable :data="store.classData" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSheetsStore } from '~/stores/sheets'

const store = useSheetsStore()

onMounted(() => {
  store.loadData()
})
</script>
