<script setup lang="ts">
const heroesStore = useHeroesStore()

onMounted(() => {
  heroesStore.fetchHeroes()
})
</script>

<template>
  <main class="mx-auto max-w-3xl p-6">
    <h1 class="text-2xl font-bold mb-4">MetaRivals</h1>

    <p v-if="heroesStore.isLoading">Загрузка героев…</p>
    <p v-else-if="heroesStore.error" class="text-red-600">{{ heroesStore.error }}</p>

    <ul v-else class="grid grid-cols-2 gap-2">
      <li
        v-for="hero in heroesStore.heroes"
        :key="hero.id"
        class="rounded border p-3"
      >
        {{ hero.name }} — <span class="text-sm text-gray-500">{{ hero.role }}</span>
      </li>
    </ul>
  </main>
</template>
