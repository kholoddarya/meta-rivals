<script setup lang="ts">
const sheetsStore = useSheetsStore()
const quickPick = useQuickPickStore()

defineProps<{
  search: string
  filteredHeroes: Array<{ name: string; role: string | null; class: string; counter: string }>
}>()

defineEmits<{
  'update:search': [value: string]
}>()

const roleColors: Record<'sup' | 'dps' | 'tnk' | 'flx' | 'unknown', string> = {
  sup: 'success',
  dps: 'error',
  tnk: 'info',
  flx: 'warning',
  unknown: 'neutral',
}

function heroStatus(name: string) {
  if (!name) return 'none'
  if (quickPick.bannedHeroes.includes(name)) return 'banned'
  if (quickPick.selectedEnemies.includes(name)) return 'enemy'
  if (quickPick.selectedMyHeroes.includes(name)) return 'ally'
  return 'none'
}

const limits = { enemies: 6, myHeroes: 5, stars: 2 }
const canAddEnemy = computed(() => quickPick.selectedEnemies.length < limits.enemies)
const canAddAlly = computed(() => quickPick.selectedMyHeroes.length < limits.myHeroes)
const canAddStar = computed(() => quickPick.starredEnemies.length < limits.stars)
</script>

<template>
  <UCard class="lg:col-span-2">
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <span class="font-semibold">Heroes</span>
        <UInput
          :model-value="search"
          @update:model-value="$emit('update:search', $event)"
          icon="i-lucide-search"
          placeholder="Search hero..."
          class="w-48"
          :disabled="quickPick.isLoading"
        />
      </div>
    </template>

    <div v-if="sheetsStore.isLoading" class="flex justify-center py-10">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-10 text-primary-500" />
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar"
    >
      <div
        v-for="hero in filteredHeroes"
        :key="hero.name"
        class="rounded-lg border p-2 flex flex-col gap-1 transition-all"
        :class="{
          'border-red-400 bg-red-50 dark:bg-red-950/30': heroStatus(hero.name) === 'enemy',
          'border-green-400 bg-green-50 dark:bg-green-950/30': heroStatus(hero.name) === 'ally',
          'border-gray-300 opacity-40 grayscale': heroStatus(hero.name) === 'banned',
          'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700':
            heroStatus(hero.name) === 'none',
        }"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium truncate" :title="hero.name">{{ hero.name }}</span>
          <UBadge
            v-if="hero.role"
            :color="roleColors[hero.role as keyof typeof roleColors] || 'neutral'"
            variant="subtle"
            size="xs"
          >
            {{
              hero.role === 'sup'
                ? 'Support'
                : hero.role === 'dps'
                  ? 'Damage'
                  : hero.role === 'tnk'
                    ? 'Tank'
                    : 'Flex'
            }}
          </UBadge>
        </div>

        <div class="flex items-center gap-1 mt-1">
          <UButton
            icon="i-lucide-swords"
            size="xs"
            :color="quickPick.selectedEnemies.includes(hero.name) ? 'error' : 'neutral'"
            :variant="quickPick.selectedEnemies.includes(hero.name) ? 'solid' : 'ghost'"
            title="Enemy"
            :disabled="!canAddEnemy && !quickPick.selectedEnemies.includes(hero.name)"
            @click="quickPick.toggleEnemy(hero.name)"
          />
          <UButton
            icon="i-lucide-shield-check"
            size="xs"
            :color="quickPick.selectedMyHeroes.includes(hero.name) ? 'success' : 'neutral'"
            :variant="quickPick.selectedMyHeroes.includes(hero.name) ? 'solid' : 'ghost'"
            title="My Hero"
            :disabled="!canAddAlly && !quickPick.selectedMyHeroes.includes(hero.name)"
            @click="quickPick.toggleMyHero(hero.name)"
          />
          <UButton
            icon="i-lucide-star"
            size="xs"
            :color="quickPick.starredEnemies.includes(hero.name) ? 'warning' : 'neutral'"
            :variant="quickPick.starredEnemies.includes(hero.name) ? 'solid' : 'ghost'"
            title="Key Enemy"
            :disabled="!canAddStar && !quickPick.starredEnemies.includes(hero.name)"
            @click="quickPick.toggleStar(hero.name)"
          />
          <UButton
            icon="i-lucide-ban"
            size="xs"
            color="neutral"
            :variant="quickPick.bannedHeroes.includes(hero.name) ? 'solid' : 'ghost'"
            title="Ban"
            @click="quickPick.toggleBan(hero.name)"
          />
        </div>
      </div>
      <div
        v-if="filteredHeroes.length === 0"
        class="col-span-full text-center py-10 text-gray-400 text-sm"
      >
        No heroes found
      </div>
    </div>
  </UCard>
</template>
