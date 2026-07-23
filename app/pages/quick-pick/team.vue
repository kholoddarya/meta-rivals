<script setup lang="ts">
import type { RoleType } from '~/types/sheets'

const { t } = useI18n()

interface FullTeamResult {
  heroes: { name: string; role: RoleType | null; tier: string | null }[]
  composition: string
  totalScore: number
  synergyScore: number
  tierScore: number
  roleScore: number
  activeSynergies: number
}

const teams = ref<FullTeamResult[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

async function loadTeams() {
  isLoading.value = true
  error.value = null
  try {
    const res = await $fetch<{ teams: FullTeamResult[] }>('/api/full-team')
    teams.value = res.teams
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('teamups.error_load')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadTeams)

const roleLabels = computed<Record<RoleType, string>>(() => ({
  sup: t('common.role_support'),
  dps: t('common.role_damage'),
  tnk: t('common.role_tank'),
}))
const roleColors: Record<RoleType, string> = { sup: 'success', dps: 'error', tnk: 'info' }

function heroInitial(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

const compositionLabels = computed<Record<string, string>>(() => ({
  '2-2-2': t('team.comp_222'),
  '3-1-2': t('team.comp_312'),
  '3-2-1': t('team.comp_321'),
  '2-3-1': t('team.comp_231'),
  '2-1-3': t('team.comp_213'),
  '3-0-3': t('team.comp_303'),
  '4-1-1': t('team.comp_411'),
  '4-0-2': t('team.comp_402'),
}))
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <header class="mb-8 text-center">
      <div
        class="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 mb-3"
      >
        <UIcon name="i-lucide-shield" class="size-3.5" /> {{ $t('common.current_meta') }}
      </div>
      <h1 class="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
        {{ $t('team.title') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{{ $t('team.subtitle') }}</p>
    </header>

    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 mb-4" />
      <p>{{ $t('team.calculating') }}</p>
    </div>
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
      icon="i-lucide-alert-triangle"
    >
      <template #actions
        ><UButton color="error" variant="outline" size="xs" @click="loadTeams">{{
          $t('common.retry')
        }}</UButton></template
      >
    </UAlert>
    <div v-else-if="!teams.length" class="text-center py-20 text-gray-500 dark:text-gray-400">
      {{ $t('team.no_teams') }}
    </div>

    <div v-else class="space-y-6">
      <UCard
        v-for="(team, index) in teams"
        :key="index"
        class="relative overflow-hidden transition-all hover:shadow-lg"
        :class="index === 0 ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''"
      >
        <div
          v-if="index < 3"
          class="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg"
        >
          {{ $t('team.pick', { index: index + 1 }) }}
        </div>
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex-1">
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div
                v-for="(hero, hIndex) in team.heroes"
                :key="hero.name"
                class="flex flex-col items-center text-center w-[72px]"
              >
                <div
                  class="size-10 rounded-full flex items-center justify-center text-sm font-semibold mb-1"
                  :class="
                    hIndex < 2
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                      : 'bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-200'
                  "
                >
                  {{ heroInitial(hero.name) }}
                </div>
                <p
                  class="text-[11px] font-medium text-gray-900 dark:text-white truncate w-full"
                  :title="hero.name"
                >
                  {{ hero.name }}
                </p>
                <UBadge
                  v-if="hero.role"
                  :color="roleColors[hero.role]"
                  variant="subtle"
                  size="xs"
                  class="mt-1"
                  >{{ roleLabels[hero.role] }}</UBadge
                >
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-2 min-w-[200px]">
            <div class="flex items-center gap-2">
              <UBadge color="primary" variant="subtle" class="font-mono font-bold text-xs">{{
                team.composition
              }}</UBadge>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{
                compositionLabels[team.composition] || $t('team.custom')
              }}</span>
            </div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div class="flex items-center gap-1">
                <span class="text-gray-500 dark:text-gray-400">{{ $t('team.team_ups') }}</span>
                <span class="font-semibold text-green-600 dark:text-green-400">{{
                  team.activeSynergies
                }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-gray-500 dark:text-gray-400">{{ $t('common.synergy') }}:</span>
                <span class="font-semibold text-purple-600 dark:text-purple-400">{{
                  team.synergyScore
                }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-gray-500 dark:text-gray-400">Tier:</span>
                <span class="font-semibold text-blue-600 dark:text-blue-400">{{
                  team.tierScore
                }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="font-semibold text-gray-700 dark:text-gray-300">{{
                  $t('common.total')
                }}</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ team.totalScore }}</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
