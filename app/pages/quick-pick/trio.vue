<script setup lang="ts">
import type { RoleType } from '~/types/sheets'

interface TrioResult {
  heroA: string
  roleA: RoleType | null
  tierA: string | null
  heroB: string
  roleB: RoleType | null
  tierB: string | null
  heroC: string
  roleC: RoleType | null
  tierC: string | null
  coreGrade: string
  totalScore: number
  synergyScore: number
  tierScore: number
  roleScore: number
}

const trios = ref<TrioResult[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

async function loadTrios() {
  isLoading.value = true
  error.value = null
  try {
    const res = await $fetch<{ trios: TrioResult[] }>('/api/trio')
    trios.value = res.trios
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load trios'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadTrios)

const roleLabels: Record<RoleType, string> = { sup: 'Support', dps: 'Damage', tnk: 'Tank' }
const roleColors: Record<RoleType, string> = { sup: 'success', dps: 'error', tnk: 'info' }

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

const selectedRoleA = ref<'all' | RoleType>('all')
const selectedRoleB = ref<'all' | RoleType>('all')
const selectedRoleC = ref<'all' | RoleType>('all')

const roleFilterOptions = [
  { label: 'All roles', value: 'all' },
  { label: 'Support', value: 'sup' },
  { label: 'Damage', value: 'dps' },
  { label: 'Tank', value: 'tnk' },
]

const {
  filteredItems: filteredTrios,
  hasActiveFilters,
  resetFilters,
} = useRoleFilter(trios, [selectedRoleA, selectedRoleB, selectedRoleC], (trio) => [
  trio.roleA,
  trio.roleB,
  trio.roleC,
])
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
    <header class="mb-8 text-center">
      <div
        class="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 mb-3"
      >
        <UIcon name="i-lucide-users-round" class="size-3.5" />
        Current meta
      </div>
      <h1 class="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Best Trios</h1>
      <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
        Core duo with strong synergy, enhanced by a third hero that maximizes team weight and
        flexibility.
      </p>
    </header>

    <div
      v-if="!isLoading && !error && trios.length"
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
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Hero C:</span>
        <USelect v-model="selectedRoleC" :items="roleFilterOptions" class="w-36" />
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

    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 mb-4" />
      <p>Calculating best trios...</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
      icon="i-lucide-alert-triangle"
    >
      <template #actions>
        <UButton color="error" variant="outline" size="xs" @click="loadTrios">Retry</UButton>
      </template>
    </UAlert>

    <div v-else-if="!trios.length" class="text-center py-20 text-gray-500 dark:text-gray-400">
      No trio data found.
    </div>
    <div
      v-else-if="!filteredTrios.length"
      class="text-center py-20 text-gray-500 dark:text-gray-400"
    >
      No trios match these filters.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="(trio, index) in filteredTrios"
        :key="`${trio.heroA}-${trio.heroB}-${trio.heroC}`"
        class="relative overflow-hidden"
      >
        <div
          v-if="index < 3"
          class="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg"
        >
          #{{ index + 1 }}
        </div>

        <div class="flex items-center justify-center gap-2 mb-4 flex-wrap">
          <div class="flex flex-col items-center text-center w-20">
            <div
              class="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base font-semibold text-gray-700 dark:text-gray-200 mb-1"
            >
              {{ heroInitial(trio.heroA) }}
            </div>
            <p
              class="text-xs font-medium text-gray-900 dark:text-white truncate w-full"
              :title="trio.heroA"
            >
              {{ trio.heroA }}
            </p>
            <UBadge
              v-if="trio.roleA"
              :color="roleColors[trio.roleA]"
              variant="subtle"
              size="xs"
              class="mt-1"
            >
              {{ roleLabels[trio.roleA] }}
            </UBadge>
          </div>

          <UIcon name="i-lucide-plus" class="size-3 text-gray-300 dark:text-gray-700 shrink-0" />

          <div class="flex flex-col items-center text-center w-20">
            <div
              class="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base font-semibold text-gray-700 dark:text-gray-200 mb-1"
            >
              {{ heroInitial(trio.heroB) }}
            </div>
            <p
              class="text-xs font-medium text-gray-900 dark:text-white truncate w-full"
              :title="trio.heroB"
            >
              {{ trio.heroB }}
            </p>
            <UBadge
              v-if="trio.roleB"
              :color="roleColors[trio.roleB]"
              variant="subtle"
              size="xs"
              class="mt-1"
            >
              {{ roleLabels[trio.roleB] }}
            </UBadge>
          </div>

          <UIcon name="i-lucide-plus" class="size-3 text-gray-300 dark:text-gray-700 shrink-0" />

          <div class="flex flex-col items-center text-center w-20">
            <div
              class="size-10 rounded-full bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-base font-semibold text-primary-700 dark:text-primary-200 mb-1"
            >
              {{ heroInitial(trio.heroC) }}
            </div>
            <p
              class="text-xs font-medium text-gray-900 dark:text-white truncate w-full"
              :title="trio.heroC"
            >
              {{ trio.heroC }}
            </p>
            <UBadge
              v-if="trio.roleC"
              :color="roleColors[trio.roleC]"
              variant="subtle"
              size="xs"
              class="mt-1"
            >
              {{ roleLabels[trio.roleC] }}
            </UBadge>
          </div>
        </div>

        <div
          class="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3"
        >
          <div class="flex flex-col gap-1">
            <span class="text-[10px] uppercase tracking-wider text-gray-400">Core Duo Synergy</span>
            <span
              class="text-xs font-bold px-2 py-1 rounded w-fit"
              :class="
                gradeStyles[trio.coreGrade]?.class ||
                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
              "
            >
              {{ gradeStyles[trio.coreGrade]?.label || trio.coreGrade }}
            </span>
          </div>
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Score:
            <span class="font-semibold text-gray-700 dark:text-gray-300">{{
              trio.totalScore
            }}</span>
          </span>
        </div>
      </UCard>
    </div>
  </div>
</template>
