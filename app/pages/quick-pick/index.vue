<script setup lang="ts">
import { useSheetsStore } from '~/stores/sheets'
import { useQuickPickStore } from '~/stores/quickPick'

const { t } = useI18n()
const toast = useToast()
const sheetsStore = useSheetsStore()
const quickPick = useQuickPickStore()

const search = ref('')

onMounted(() => {
  if (sheetsStore.heroesList.length === 0 && !sheetsStore.isLoading) {
    sheetsStore.loadData()
  }
})

const filteredHeroes = computed(() => {
  if (!sheetsStore.heroesList?.length) return []
  const q = search.value.trim().toLowerCase()
  if (!q) return sheetsStore.heroesList
  return sheetsStore.heroesList.filter((h) => h.name?.toLowerCase().includes(q))
})

const roleColors: Record<'sup' | 'dps' | 'tnk' | 'flx' | 'unknown', string> = {
  sup: 'success',
  dps: 'error',
  tnk: 'info',
  flx: 'warning',
  unknown: 'neutral',
}

function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    sup: t('qp.role_sup'),
    dps: t('qp.role_dps'),
    tnk: t('qp.role_tnk'),
    flx: t('qp.role_flx'),
  }
  return roleMap[role] || 'Flex'
}

function heroStatus(name: string) {
  if (!name) return 'none'
  if (quickPick.bannedHeroes.includes(name)) return 'banned'
  if (quickPick.selectedEnemies.includes(name)) return 'enemy'
  if (quickPick.selectedMyHeroes.includes(name)) return 'ally'
  return 'none'
}

const limits = {
  enemies: 6,
  myHeroes: 5,
  stars: 2,
  totalTeam: 6,
  maxPerRole: 3,
  maxFlx: 3,
}

const myHeroesCount = computed(() => quickPick.selectedMyHeroes.length)
const draftedRolesCount = computed(() => {
  return (
    quickPick.roleCounts.sup +
    quickPick.roleCounts.dps +
    quickPick.roleCounts.tnk +
    quickPick.roleCounts.flx
  )
})
const totalTeamSize = computed(() => myHeroesCount.value + draftedRolesCount.value)

const canAddRole = (role: 'sup' | 'dps' | 'tnk' | 'flx') => {
  if (totalTeamSize.value >= limits.totalTeam) return false
  const max = role === 'flx' ? limits.maxFlx : limits.maxPerRole
  return quickPick.roleCounts[role] < max
}

const canRemoveRole = (role: 'sup' | 'dps' | 'tnk' | 'flx') => {
  return quickPick.roleCounts[role] > 0
}

const canAddEnemy = computed(() => quickPick.selectedEnemies.length < limits.enemies)
const canAddAlly = computed(() => quickPick.selectedMyHeroes.length < limits.myHeroes)
const canAddStar = computed(() => quickPick.starredEnemies.length < limits.stars)

const otherPages = [
  {
    to: '/data-base',
    icon: 'i-lucide-database',
    title: t('home.tools.data_base'),
    description: t('home.tools.data_base_desc'),
  },
  {
    to: '/quick-pick/duo',
    icon: 'i-lucide-users',
    title: t('home.tools.duo'),
    description: t('home.tools.duo_desc'),
  },
  {
    to: '/quick-pick/trio',
    icon: 'i-lucide-users-round',
    title: t('home.tools.trio'),
    description: t('home.tools.trio_desc'),
  },
  {
    to: '/quick-pick/quadro',
    icon: 'i-lucide-user-plus',
    title: t('home.tools.quadro'),
    description: t('home.tools.quadro_desc'),
  },
  {
    to: '/quick-pick/team',
    icon: 'i-lucide-shield',
    title: t('home.tools.full_team'),
    description: t('home.tools.full_team_desc'),
  },
  {
    to: '/quick-pick/teamups',
    icon: 'i-lucide-flame',
    title: t('home.tools.team_ups'),
    description: t('home.tools.team_ups_desc'),
  },
]

const VALID_COMPOSITIONS = ['2-2-2', '3-1-2', '3-2-1', '2-3-1', '2-1-3', '3-0-3', '4-1-1', '4-0-2']

const translatedDetailsCache = ref<Record<string, string>>({})
const isTranslatingCache = ref<Record<string, boolean>>({})

const processedTopTeams = ref<any[]>([])

watch(
  () => quickPick.lastResult?.teams,
  async (newTeams) => {
    if (!newTeams || newTeams.length === 0) {
      processedTopTeams.value = []
      return
    }

    const validTeams = newTeams.filter((team: any) =>
      VALID_COMPOSITIONS.includes(team.finalComposition)
    )
    const pool = validTeams.length > 0 ? validTeams : newTeams
    const hasValidComposition = validTeams.length > 0

    const top3 = pool
      .sort((a: any, b: any) => b.totalScore - a.totalScore)
      .slice(0, 3)
      .map((team: any, index: number) => ({
        ...team,
        rank:
          index === 0
            ? hasValidComposition
              ? t('qp.rank_top')
              : t('qp.rank_best')
            : `${t('qp.rank_alt')} ${index}`,
        isSuboptimal: !hasValidComposition,
        displayDetails: team.formattedDetails || t('qp.details_empty'),
      }))

    processedTopTeams.value = top3

    for (const team of processedTopTeams.value) {
      const originalText = team.formattedDetails

      if (originalText && /[а-яА-ЯёЁ]/.test(originalText)) {
        if (!translatedDetailsCache.value[originalText]) {
          isTranslatingCache.value[originalText] = true

          try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
              originalText
            )}&langpair=ru|en`
            const res = await fetch(url)
            const data = await res.json()

            if (data.responseStatus === 200) {
              translatedDetailsCache.value[originalText] = data.responseData.translatedText
            } else {
              translatedDetailsCache.value[originalText] = originalText
            }
          } catch (e) {
            console.error('MyMemory translation error', e)
            translatedDetailsCache.value[originalText] = originalText
          } finally {
            isTranslatingCache.value[originalText] = false
          }
        }

        team.displayDetails = translatedDetailsCache.value[originalText] || originalText
      }
    }
  },
  { immediate: true }
)

const handleRoleChange = (role: 'sup' | 'dps' | 'tnk' | 'flx', delta: number) => {
  if (delta > 0 && totalTeamSize.value >= limits.totalTeam) {
    toast.add({
      title: t('qp.total_label'),
      description: `${t('qp.total_tooltip')}`,
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
      timeout: 4000,
    })
    return
  }
  if (delta < 0 && quickPick.roleCounts[role] <= 0) return
  quickPick.changeRole(role, delta)
}

const pendingRoleReduction = ref<{ role: 'sup' | 'dps' | 'tnk' | 'flx' | null; timestamp: number }>(
  {
    role: null,
    timestamp: 0,
  }
)

watch(
  pendingRoleReduction,
  (newVal) => {
    if (newVal.role && newVal.timestamp > 0) {
      const role = newVal.role
      if (quickPick.roleCounts[role] > 0) {
        quickPick.changeRole(role, -1)
      }
      pendingRoleReduction.value = { role: null, timestamp: 0 }
    }
  },
  { immediate: false }
)

const handleAddRecommendedHero = (heroName: string, heroRole: string | null) => {
  if (!quickPick.selectedMyHeroes.includes(heroName)) {
    quickPick.selectedMyHeroes.push(heroName)
  }

  const role = heroRole as 'sup' | 'dps' | 'tnk' | 'flx'
  if (role && (role === 'sup' || role === 'dps' || role === 'tnk' || role === 'flx')) {
    pendingRoleReduction.value = { role, timestamp: Date.now() }
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-8">
    <div class="flex flex-col sm:flex-row justify-between gap-4">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold">{{ $t('qp.title') }}</h1>
        <p class="text-gray-500 dark:text-gray-400">
          {{ $t('qp.subtitle') }}
        </p>
      </div>
    </div>

    <UAlert v-if="sheetsStore.error" color="error" variant="soft" :title="sheetsStore.error">
      <template #actions>
        <UButton color="error" variant="outline" size="xs" @click="sheetsStore.loadData()">
          {{ $t('qp.retry') }}
        </UButton>
      </template>
    </UAlert>

    <div
      v-if="sheetsStore.isLoading"
      class="flex flex-col items-center justify-center py-20 space-y-4"
    >
      <UIcon name="i-lucide-loader-2" class="animate-spin size-10 text-primary-500" />
      <p class="text-gray-500 dark:text-gray-400">{{ $t('qp.loading') }}</p>
    </div>

    <div v-else-if="!sheetsStore.heroesList.length" class="text-center py-20 text-gray-500">
      {{ $t('qp.empty') }}
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Hero List -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="font-semibold">{{ $t('qp.heroes_title') }}</span>
              <div
                class="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
              >
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-swords" class="size-4 text-error-500" />
                  <span>{{ $t('qp.legend_enemy') }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-shield-check" class="size-4 text-success-500" />
                  <span>{{ $t('qp.legend_ally') }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-star" class="size-4 text-warning-500" />
                  <span>{{ $t('qp.legend_key') }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-ban" class="size-4 text-gray-500" />
                  <span>{{ $t('qp.legend_ban') }}</span>
                </div>
              </div>
            </div>
            <UInput
              v-model="search"
              icon="i-lucide-search"
              :placeholder="$t('qp.search_placeholder')"
              class="w-48"
              :disabled="quickPick.isLoading"
            />
          </div>
        </template>

        <div
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
                {{ getRoleLabel(hero.role) }}
              </UBadge>
            </div>
            <div class="flex items-center gap-1 mt-1">
              <UTooltip :text="$t('qp.legend_enemy')" :popper="{ placement: 'top' }">
                <UButton
                  icon="i-lucide-swords"
                  size="xs"
                  :color="quickPick.selectedEnemies.includes(hero.name) ? 'error' : 'neutral'"
                  :variant="quickPick.selectedEnemies.includes(hero.name) ? 'solid' : 'ghost'"
                  :disabled="!canAddEnemy && !quickPick.selectedEnemies.includes(hero.name)"
                  @click="quickPick.toggleEnemy(hero.name)"
                />
              </UTooltip>
              <UTooltip :text="$t('qp.legend_ally')" :popper="{ placement: 'top' }">
                <UButton
                  icon="i-lucide-shield-check"
                  size="xs"
                  :color="quickPick.selectedMyHeroes.includes(hero.name) ? 'success' : 'neutral'"
                  :variant="quickPick.selectedMyHeroes.includes(hero.name) ? 'solid' : 'ghost'"
                  :disabled="!canAddAlly && !quickPick.selectedMyHeroes.includes(hero.name)"
                  @click="quickPick.toggleMyHero(hero.name)"
                />
              </UTooltip>
              <UTooltip :text="$t('qp.legend_key')" :popper="{ placement: 'top' }">
                <UButton
                  icon="i-lucide-star"
                  size="xs"
                  :color="quickPick.starredEnemies.includes(hero.name) ? 'warning' : 'neutral'"
                  :variant="quickPick.starredEnemies.includes(hero.name) ? 'solid' : 'ghost'"
                  :disabled="!canAddStar && !quickPick.starredEnemies.includes(hero.name)"
                  @click="quickPick.toggleStar(hero.name)"
                />
              </UTooltip>
              <UTooltip :text="$t('qp.legend_ban')" :popper="{ placement: 'top' }">
                <UButton
                  icon="i-lucide-ban"
                  size="xs"
                  color="neutral"
                  :variant="quickPick.bannedHeroes.includes(hero.name) ? 'solid' : 'ghost'"
                  @click="quickPick.toggleBan(hero.name)"
                />
              </UTooltip>
            </div>
          </div>
          <div
            v-if="filteredHeroes.length === 0"
            class="col-span-full text-center py-10 text-gray-400 text-sm"
          >
            {{ $t('qp.no_heroes') }}
          </div>
        </div>
      </UCard>

      <!-- Generation Settings -->
      <div class="space-y-6">
        <UCard>
          <template #header>
            <span class="font-semibold">{{ $t('qp.roles_title') }}</span>
          </template>
          <div class="space-y-3">
            <div
              v-for="role in ['sup', 'dps', 'tnk', 'flx'] as const"
              :key="role"
              class="flex items-center justify-between"
            >
              <span class="text-sm">{{ getRoleLabel(role) }}</span>
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-minus"
                  size="xs"
                  variant="soft"
                  :disabled="!canRemoveRole(role) || quickPick.isLoading"
                  @click="handleRoleChange(role, -1)"
                />
                <span class="w-4 text-center text-sm font-medium">{{
                  quickPick.roleCounts[role]
                }}</span>
                <UButton
                  icon="i-lucide-plus"
                  size="xs"
                  variant="soft"
                  :disabled="!canAddRole(role) || quickPick.isLoading"
                  @click="handleRoleChange(role, 1)"
                />
              </div>
            </div>
          </div>
          <template #footer>
            <UTooltip
              :text="$t('qp.total_tooltip')"
              :disabled="totalTeamSize < 6"
              :content="{ side: 'top' }"
            >
              <div class="flex items-center justify-between cursor-help">
                <div class="flex flex-col">
                  <span
                    class="text-xs font-medium transition-colors"
                    :class="totalTeamSize >= 6 ? 'text-red-500 font-bold' : 'text-gray-500'"
                  >
                    {{ $t('qp.total_label') }}: {{ totalTeamSize }} / 6
                  </span>
                  <span class="text-[10px] text-gray-400"
                    >({{ myHeroesCount }} heroes + {{ draftedRolesCount }} roles)</span
                  >
                </div>
                <UIcon
                  v-if="totalTeamSize >= 6"
                  name="i-lucide-circle-alert"
                  class="size-4 text-red-500 shrink-0 ml-2"
                />
              </div>
            </UTooltip>
          </template>
        </UCard>

        <UCard>
          <template #header>
            <span class="font-semibold">{{ $t('qp.params_title') }}</span>
          </template>
          <div class="space-y-2">
            <UCheckbox
              v-model="quickPick.options.useSynergies"
              :label="$t('qp.param_synergies')"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useSoloSynergies"
              :label="$t('qp.param_solo')"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useTiers"
              :label="$t('qp.param_tiers')"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useCounterPicks"
              :label="$t('qp.param_counters')"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useClassWeights"
              :label="$t('qp.param_class_weights')"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useAntiRoleWeights"
              :label="$t('qp.param_anti_role')"
              :disabled="quickPick.isLoading"
            />
          </div>
        </UCard>

        <div class="space-y-3">
          <div class="flex gap-2">
            <UButton
              block
              :loading="quickPick.isLoading"
              :disabled="totalTeamSize === 0 || sheetsStore.isLoading || quickPick.isLoading"
              icon="i-lucide-wand-2"
              @click="quickPick.generateTeams"
            >
              {{ quickPick.isLoading ? $t('qp.btn_generating') : $t('qp.btn_generate') }}
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              block
              :icon="quickPick.isLoading ? '' : 'i-lucide-rotate-ccw'"
              :disabled="quickPick.isLoading"
              @click="quickPick.clearAll"
            >
              {{ $t('qp.btn_clear') }}
            </UButton>
          </div>
          <p
            v-if="totalTeamSize === 0"
            class="text-xs text-center text-amber-600 dark:text-amber-400 font-medium"
          >
            {{ $t('qp.warning_empty') }}
          </p>
          <UAlert v-if="quickPick.error" color="error" variant="soft" :title="quickPick.error" />
        </div>
      </div>
    </div>

    <!-- Generation Result: Top 3 Teams -->
    <div v-if="quickPick.lastResult && processedTopTeams.length > 0" class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon name="i-lucide-sparkles" class="size-6 text-primary-500" />
        {{ $t('qp.results_title') }}
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UCard
          v-for="(team, index) in processedTopTeams"
          :key="index"
          class="relative transition-all hover:shadow-lg"
          :class="
            team.isSuboptimal
              ? 'border-amber-300 dark:border-amber-700'
              : 'border-primary-200 dark:border-primary-800'
          "
        >
          <!-- Rank Badge -->
          <div class="absolute -top-2 left-4">
            <UBadge
              :color="team.isSuboptimal ? 'warning' : 'primary'"
              variant="solid"
              size="sm"
              class="shadow-sm"
            >
              {{ team.rank }}
            </UBadge>
          </div>

          <!-- Composition & Warning -->
          <div class="flex items-center justify-between mb-4 pt-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {{ $t('qp.composition') }}
              </span>
              <UBadge color="neutral" variant="subtle" class="font-mono font-bold text-sm">
                {{ team.finalComposition }}
              </UBadge>
            </div>
            <UIcon
              v-if="team.isSuboptimal"
              name="i-lucide-alert-triangle"
              class="size-5 text-amber-500"
              :title="$t('qp.rank_best')"
            />
          </div>

          <!--  Metrics Grid -->
          <div class="grid grid-cols-4 gap-2 mb-4">
            <div class="bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-center">
              <div class="text-lg font-bold text-gray-900 dark:text-white">
                {{ team.totalScore }}
              </div>
              <div class="text-[10px] uppercase tracking-wider text-gray-500">
                {{ $t('qp.metric_total') }}
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-center">
              <div class="text-lg font-bold text-purple-600 dark:text-purple-400">
                {{ team.synergyScore }}
              </div>
              <div class="text-[10px] uppercase tracking-wider text-gray-500">
                {{ $t('qp.metric_synergy') }} ({{ team.synergyCount }})
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-center">
              <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                {{ team.tierScore }}
              </div>
              <div class="text-[10px] uppercase tracking-wider text-gray-500">
                {{ $t('qp.metric_tier') }}
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-center">
              <div class="text-lg font-bold text-green-600 dark:text-green-400">
                {{ team.roleScore }}
              </div>
              <div class="text-[10px] uppercase tracking-wider text-gray-500">
                {{ $t('qp.metric_role') }}
              </div>
            </div>
          </div>

          <!-- Added Members List -->
          <div class="space-y-2">
            <p
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
            >
              {{ $t('qp.additions_title') }}
            </p>
            <div
              v-for="heroName in team.addedMembers"
              :key="heroName"
              class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/30 rounded border border-gray-100 dark:border-gray-700"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ heroName }}
                </span>
                <UBadge
                  v-if="sheetsStore.heroesList.find((h) => h.name === heroName)?.role"
                  :color="
                    roleColors[
                      sheetsStore.heroesList.find((h) => h.name === heroName)!
                        .role as keyof typeof roleColors
                    ] || 'neutral'
                  "
                  variant="subtle"
                  size="xs"
                >
                  {{
                    getRoleLabel(
                      sheetsStore.heroesList.find((h) => h.name === heroName)?.role || 'flx'
                    )
                  }}
                </UBadge>
              </div>
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-lucide-plus"
                :disabled="quickPick.selectedMyHeroes.includes(heroName) || quickPick.isLoading"
                @click="
                  handleAddRecommendedHero(
                    heroName,
                    sheetsStore.heroesList.find((h) => h.name === heroName)?.role || null
                  )
                "
              >
                {{
                  quickPick.selectedMyHeroes.includes(heroName)
                    ? $t('qp.btn_added')
                    : $t('qp.btn_add')
                }}
              </UButton>
            </div>
          </div>

          <!-- Details Accordion -->
          <details class="group mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <summary
              class="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 list-none"
            >
              <UIcon
                name="i-lucide-chevron-down"
                class="size-3 transition-transform group-open:rotate-180"
              />
              {{ $t('qp.details_summary') }}
            </summary>
            <div
              class="mt-2 text-xs space-y-1 text-gray-600 dark:text-gray-300"
              v-html="team.displayDetails || $t('qp.details_empty')"
            />
          </details>
        </UCard>
      </div>
    </div>

    <!-- Links to other tools -->
    <div class="space-y-3 pt-4">
      <h2 class="text-xl font-semibold">{{ $t('qp.other_tools_title') }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink v-for="page in otherPages" :key="page.to" :to="page.to">
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
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}
</style>
