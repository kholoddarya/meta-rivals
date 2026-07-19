<template>
  <div
    :class="`flex flex-col items-center p-2 border-2 rounded-lg bg-white dark:bg-gray-800 ${colorClasses[color]}`"
  >
    <div class="text-xs font-bold mb-1">{{ icon }} {{ label }}</div>
    <div class="flex items-center gap-2">
      <button
        class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold"
        @click="$emit('change', -1)"
      >
        −
      </button>
      <span class="w-4 text-center font-bold text-sm">{{ count }}</span>
      <button
        class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold"
        @click="$emit('change', 1)"
      >
        +
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  role: string
  label: string
  icon: string
  color: 'green' | 'pink' | 'blue' | 'orange'
  count: number
}>()

defineEmits<{
  change: [delta: number]
}>()

const colorClasses: Record<string, string> = {
  green: 'border-green-500 text-green-700 dark:text-green-400',
  pink: 'border-pink-500 text-pink-700 dark:text-pink-400',
  blue: 'border-blue-500 text-blue-700 dark:text-blue-400',
  orange: 'border-orange-500 text-orange-700 dark:text-orange-400',
}
</script>
