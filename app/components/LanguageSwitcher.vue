<script setup lang="ts">
const { locale, setLocale } = useI18n()

const currentLocale = computed(() => locale.value)

const toggleLocale = async () => {
  const newLocale = currentLocale.value === 'ru' ? 'en' : 'ru'
  await setLocale(newLocale)
}
</script>

<template>
  <ClientOnly>
    <div class="relative inline-flex items-center">
      <UButton
        icon="i-lucide-globe"
        color="gray"
        variant="ghost"
        size="md"
        :aria-label="`Current language: ${currentLocale === 'ru' ? 'Russian' : 'English'}`"
        class="cursor-pointer"
        @click="toggleLocale"
      />
      <span class="absolute -top-1 -right-1 text-[10px] font-bold text-gray-600 dark:text-gray-400">
        {{ currentLocale.toUpperCase() }}
      </span>
    </div>
    <template #fallback>
      <div class="w-8 h-8" />
    </template>
  </ClientOnly>
</template>
