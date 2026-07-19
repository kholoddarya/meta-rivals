<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
    <div class="max-w-5xl mx-auto">
      <!-- Заголовок с навигацией назад -->
      <div class="mb-6">
        <NuxtLink to="/quick-pick" class="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Назад к выбору режима
        </NuxtLink>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">👥 Duo (2v2)</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Подбор оптимальных пар для дуэлей 2 на 2
        </p>
      </div>

      <!-- Информационный блок -->
      <div
        class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Рекомендации для Duo:app/pages/quick-pick/duo.vue
        </h3>
        <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Оптимальная раскладка: 1 Support + 1 DPS/Tank</li>
          <li>Ищите героев с сильной синергией SA/S</li>
          <li>Учитывайте контрпики против популярных дуо</li>
        </ul>
      </div>

      <!-- Основной контент (аналогичен главной странице, но с ограничениями) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Здесь тот же функционал, но с автоматическим ограничением на 2 роли -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuickPickStore } from '~/stores/quickPick'

const qpStore = useQuickPickStore()

// Автоматически ограничиваем на 2 роли для Duo
watch(
  () => qpStore.totalRoles,
  (newVal) => {
    if (newVal > 2) {
      // Сбрасываем лишние роли
      qpStore.changeRole('sup', -1)
      qpStore.changeRole('dps', -1)
      qpStore.changeRole('tnk', -1)
    }
  }
)
</script>
