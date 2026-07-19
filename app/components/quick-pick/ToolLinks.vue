<script setup lang="ts">
defineProps<{
  pages: Array<{ to: string; icon: string; title: string; description: string }>
}>()
</script>

<template>
  <div class="space-y-3 pt-4">
    <h2 class="text-xl font-semibold">Other Tools</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink v-for="page in pages" :key="page.to" :to="page.to">
        <UCard class="h-full hover:ring-2 hover:ring-primary-500 transition cursor-pointer">
          <div class="flex items-start gap-3">
            <UIcon :name="page.icon" class="size-6 text-primary-500 shrink-0 mt-0.5" />
            <div>
              <p class="font-medium">{{ page.title }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ page.description }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </div>
</template>
