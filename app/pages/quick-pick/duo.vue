<script setup lang="ts">
import type { RoleType } from '~/types/sheets'

interface DuoResult {
  heroA: string
  roleA: RoleType | null
  tierA: string | null
  heroB: string
  roleB: RoleType | null
  tierB: string | null
  grade: string
  synergyScore: number
  tierScore: number
  roleScore: number
  totalScore: number
}

const duos = ref<DuoResult[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

async function loadDuos() {
  isLoading.value = true
  error.value = null
  try {
    const res = await $fetch<{ duos: DuoResult[] }>('/api/teamups') // или ваш endpoint для дуо
    duos.value = res.duos
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load duos'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadDuos)

const roleLabels: Record<RoleType, string> = {
  sup: 'Support',
  dps: 'Damage',
  tnk: 'Tank',
}

const roleColors: Record<RoleType, string> = {
  sup: 'success',
  dps: 'error',
  tnk: 'info',
}

const gradeStyles: Record<string, { label: string; class: string }> = {
  SA: {
    label: 'SA',
    class: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  },
  S: { label: 'S', class: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  A: { label: 'A', class: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300' },
  B: { label: 'B', class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
}

function heroInitial(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

// --- Filters ---
const selectedRoleA = ref<'all' | RoleType>('all')
const selectedRoleB = ref<'all' | RoleType>('all')

const roleFilterOptions = [
  { label: 'All roles', value: 'all' },
  { label: 'Support', value: 'sup' },
  { label: 'Damage', value: 'dps' },
  { label: 'Tank', value: 'tnk' },
]

const {
  filteredItems: filteredDuos,
  hasActiveFilters,
  resetFilters,
} = useRoleFilter(duos, [selectedRoleA, selectedRoleB], (duo) => [duo.roleA, duo.roleB])
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex justify-between">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors group w-fit"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="size-4 transition-transform group-hover:-translate-x-1"
        />
        Back to Home
      </NuxtLink>
      <ThemeToggle />
    </div>
    <header class="mb-8 text-center">
      <div
        class="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 mb-3"
      >
        <UIcon name="i-lucide-users" class="size-3.5" />
        Current meta
      </div>
      <h1 class="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Best Duos</h1>
      <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
        The strongest hero duos right now, ranked by synergy grade, hero tiers, and role weight.
      </p>
    </header>

    <!-- Filters -->
    <div
      v-if="!isLoading && !error && duos.length"
      class="flex flex-wrap items-center justify-center gap-3 mb-8"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Hero A:</span>
        <USelect v-model="selectedRoleA" :items="roleFilterOptions" class="w-36" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Hero B:</span>
        <USelect v-model="selectedRoleB" :items="roleFilterOptions" class="w-36" />
      </div>

      <UButton
        v-if="hasActiveFilters"
        color="neutral"
        variant="soft"
        size="sm"
        icon="i-lucide-rotate-ccw"
        @click="resetFilters"
      >
        Reset
      </UButton>
    </div>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 mb-4" />
      <p>Calculating best duos...</p>
    </div>

    <!-- Error -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
      icon="i-lucide-alert-triangle"
    >
      <template #actions>
        <UButton color="error" variant="outline" size="xs" @click="loadDuos">Retry</UButton>
      </template>
    </UAlert>

    <!-- Empty states -->
    <div v-else-if="!duos.length" class="text-center py-20 text-gray-500 dark:text-gray-400">
      No duo data found.
    </div>
    <div
      v-else-if="!filteredDuos.length"
      class="text-center py-20 text-gray-500 dark:text-gray-400"
    >
      No duos match these filters.
    </div>

    <!-- Duo grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UCard
        v-for="(duo, index) in filteredDuos"
        :key="`${duo.heroA}-${duo.heroB}`"
        class="relative overflow-hidden"
      >
        <div
          v-if="index < 3"
          class="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg"
        >
          #{{ index + 1 }}
        </div>

        <div class="flex items-center justify-center gap-3 mb-4">
          <!-- Hero A -->
          <div class="flex flex-col items-center text-center w-24">
            <div
              class="size-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2"
            >
              {{ heroInitial(duo.heroA) }}
            </div>
            <p
              class="text-sm font-medium text-gray-900 dark:text-white truncate w-full"
              :title="duo.heroA"
            >
              {{ duo.heroA }}
            </p>
            <UBadge
              v-if="duo.roleA"
              :color="roleColors[duo.roleA]"
              variant="subtle"
              size="xs"
              class="mt-1"
            >
              {{ roleLabels[duo.roleA] }}
            </UBadge>
          </div>

          <UIcon name="i-lucide-plus" class="size-4 text-gray-300 dark:text-gray-700 shrink-0" />

          <!-- Hero B -->
          <div class="flex flex-col items-center text-center w-24">
            <div
              class="size-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2"
            >
              {{ heroInitial(duo.heroB) }}
            </div>
            <p
              class="text-sm font-medium text-gray-900 dark:text-white truncate w-full"
              :title="duo.heroB"
            >
              {{ duo.heroB }}
            </p>
            <UBadge
              v-if="duo.roleB"
              :color="roleColors[duo.roleB]"
              variant="subtle"
              size="xs"
              class="mt-1"
            >
              {{ roleLabels[duo.roleB] }}
            </UBadge>
          </div>
        </div>

        <div
          class="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3"
        >
          <span
            class="text-xs font-bold px-2 py-1 rounded"
            :class="
              gradeStyles[duo.grade]?.class ||
              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
            "
          >
            Synergy {{ gradeStyles[duo.grade]?.label || duo.grade }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Score:
            <span class="font-semibold text-gray-700 dark:text-gray-300">{{ duo.totalScore }}</span>
          </span>
        </div>
      </UCard>
    </div>
  </div>
</template>
