<script setup lang="ts">
import type { RoleType } from '~/types/sheets'

interface QuadroResult {
  heroA: string
  roleA: RoleType | null
  tierA: string | null
  heroB: string
  roleB: RoleType | null
  tierB: string | null
  heroC: string
  roleC: RoleType | null
  tierC: string | null
  heroD: string
  roleD: RoleType | null
  tierD: string | null
  gradeAB: string
  gradeCD: string
  totalScore: number
  synergyScore: number
  tierScore: number
  roleScore: number
}

const quadri = ref<QuadroResult[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

async function loadQuadri() {
  isLoading.value = true
  error.value = null
  try {
    const res = await $fetch<{ quadri: QuadroResult[] }>('/api/quadro')
    quadri.value = res.quadri
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load quadri'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadQuadri)

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
const selectedRoleD = ref<'all' | RoleType>('all')

const roleFilterOptions = [
  { label: 'All roles', value: 'all' },
  { label: 'Support', value: 'sup' },
  { label: 'Damage', value: 'dps' },
  { label: 'Tank', value: 'tnk' },
]

const {
  filteredItems: filteredQuadri,
  hasActiveFilters,
  resetFilters,
} = useRoleFilter(quadri, [selectedRoleA, selectedRoleB, selectedRoleC, selectedRoleD], (q) => [
  q.roleA,
  q.roleB,
  q.roleC,
  q.roleD,
])
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
        <UIcon name="i-lucide-user-plus" class="size-3.5" />
        Current meta
      </div>
      <h1 class="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Best Quadri</h1>
      <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
        Two powerful duos combined into a 4-hero squad. Each pair has its own synergy grade.
      </p>
    </header>

    <div
      v-if="!isLoading && !error && quadri.length"
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
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Hero D:</span>
        <USelect v-model="selectedRoleD" :items="roleFilterOptions" class="w-36" />
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
      <p>Calculating best quadri...</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
      icon="i-lucide-alert-triangle"
    >
      <template #actions>
        <UButton color="error" variant="outline" size="xs" @click="loadQuadri">Retry</UButton>
      </template>
    </UAlert>

    <div v-else-if="!quadri.length" class="text-center py-20 text-gray-500 dark:text-gray-400">
      No quadri data found.
    </div>
    <div
      v-else-if="!filteredQuadri.length"
      class="text-center py-20 text-gray-500 dark:text-gray-400"
    >
      No quadri match these filters.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <UCard
        v-for="(q, index) in filteredQuadri"
        :key="`${q.heroA}-${q.heroB}-${q.heroC}-${q.heroD}`"
        class="relative overflow-hidden"
      >
        <div
          v-if="index < 3"
          class="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg"
        >
          #{{ index + 1 }}
        </div>

        <div class="flex items-stretch justify-center gap-3 mb-4">
          <!-- Duo 1: A + B -->
          <div class="flex flex-col items-center gap-2">
            <div class="flex items-center gap-2">
              <div class="flex flex-col items-center text-center w-20">
                <div
                  class="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base font-semibold text-gray-700 dark:text-gray-200 mb-1"
                >
                  {{ heroInitial(q.heroA) }}
                </div>
                <p
                  class="text-xs font-medium text-gray-900 dark:text-white truncate w-full"
                  :title="q.heroA"
                >
                  {{ q.heroA }}
                </p>
                <UBadge
                  v-if="q.roleA"
                  :color="roleColors[q.roleA]"
                  variant="subtle"
                  size="xs"
                  class="mt-1"
                >
                  {{ roleLabels[q.roleA] }}
                </UBadge>
              </div>

              <UIcon name="i-lucide-link" class="size-4 text-primary-400 shrink-0" />

              <div class="flex flex-col items-center text-center w-20">
                <div
                  class="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base font-semibold text-gray-700 dark:text-gray-200 mb-1"
                >
                  {{ heroInitial(q.heroB) }}
                </div>
                <p
                  class="text-xs font-medium text-gray-900 dark:text-white truncate w-full"
                  :title="q.heroB"
                >
                  {{ q.heroB }}
                </p>
                <UBadge
                  v-if="q.roleB"
                  :color="roleColors[q.roleB]"
                  variant="subtle"
                  size="xs"
                  class="mt-1"
                >
                  {{ roleLabels[q.roleB] }}
                </UBadge>
              </div>
            </div>
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded"
              :class="
                gradeStyles[q.gradeAB]?.class ||
                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
              "
            >
              Duo 1: {{ gradeStyles[q.gradeAB]?.label || q.gradeAB }}
            </span>
          </div>

          <!-- Divider -->
          <div class="w-px bg-gray-200 dark:bg-gray-700 self-stretch" />

          <!-- Duo 2: C + D -->
          <div class="flex flex-col items-center gap-2">
            <div class="flex items-center gap-2">
              <div class="flex flex-col items-center text-center w-20">
                <div
                  class="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base font-semibold text-gray-700 dark:text-gray-200 mb-1"
                >
                  {{ heroInitial(q.heroC) }}
                </div>
                <p
                  class="text-xs font-medium text-gray-900 dark:text-white truncate w-full"
                  :title="q.heroC"
                >
                  {{ q.heroC }}
                </p>
                <UBadge
                  v-if="q.roleC"
                  :color="roleColors[q.roleC]"
                  variant="subtle"
                  size="xs"
                  class="mt-1"
                >
                  {{ roleLabels[q.roleC] }}
                </UBadge>
              </div>

              <UIcon name="i-lucide-link" class="size-4 text-primary-400 shrink-0" />

              <div class="flex flex-col items-center text-center w-20">
                <div
                  class="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base font-semibold text-gray-700 dark:text-gray-200 mb-1"
                >
                  {{ heroInitial(q.heroD) }}
                </div>
                <p
                  class="text-xs font-medium text-gray-900 dark:text-white truncate w-full"
                  :title="q.heroD"
                >
                  {{ q.heroD }}
                </p>
                <UBadge
                  v-if="q.roleD"
                  :color="roleColors[q.roleD]"
                  variant="subtle"
                  size="xs"
                  class="mt-1"
                >
                  {{ roleLabels[q.roleD] }}
                </UBadge>
              </div>
            </div>
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded"
              :class="
                gradeStyles[q.gradeCD]?.class ||
                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
              "
            >
              Duo 2: {{ gradeStyles[q.gradeCD]?.label || q.gradeCD }}
            </span>
          </div>
        </div>

        <div
          class="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3"
        >
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Synergy:
            <span class="font-semibold text-gray-700 dark:text-gray-300">{{ q.synergyScore }}</span>
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Total:
            <span class="font-semibold text-gray-700 dark:text-gray-300">{{ q.totalScore }}</span>
          </span>
        </div>
      </UCard>
    </div>
  </div>
</template>
