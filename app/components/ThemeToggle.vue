<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggleTheme = () => {
  // Переключаем между 'dark' и 'light'
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <ClientOnly>
    <UButton
      :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
      color="gray"
      variant="ghost"
      size="md"
      :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
      class="cursor-pointer"
      @click="toggleTheme"
    />
    <template #fallback>
      <!-- Плейсхолдер, чтобы кнопка не "прыгала" при загрузке -->
      <div class="w-8 h-8" />
    </template>
  </ClientOnly>
</template>
