<template>
  <button
    :class="[
      'h-8 flex items-center justify-center rounded border text-sm transition-all',
      active
        ? activeClass
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
    ]"
    :title="title"
    @click="$emit('click')"
  >
    {{ icon }}
  </button>
</template>

<script setup lang="ts">
defineProps<{
  active: boolean
  icon: string
  title: string
  activeClass: string
}>()

defineEmits<{
  click: []
}>()
</script>
