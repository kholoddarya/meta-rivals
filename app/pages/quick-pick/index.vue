<script setup lang="ts">
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
    to: '/quick-pick/duo',
    icon: 'i-lucide-users',
    title: 'Duo',
    description: 'Team building for two heroes, focusing on bonds and synergies between the pair.',
  },
  {
    to: '/quick-pick/trio',
    icon: 'i-lucide-users-round',
    title: 'Trio',
    description:
      'A combination of three heroes — balancing roles and team bonuses for a small group.',
  },
  {
    to: '/quick-pick/quadro',
    icon: 'i-lucide-user-plus',
    title: 'Quad',
    description: 'A four-player party — expanded role selection and counter-picks against enemies.',
  },
  {
    to: '/quick-pick/team',
    icon: 'i-lucide-shield',
    title: 'Full Team',
    description:
      'Generates a 6-hero lineup based on player preferences, taking into account tiers, classes, and counter-picks.',
  },
  {
    to: '/quick-pick/teamups',
    icon: 'i-lucide-flame',
    title: 'Team-Ups',
    description:
      'Theoretically the strongest team compositions based on team-ups and current hero meta strength.',
  },
  {
    to: '/data-base',
    icon: 'i-lucide-database',
    title: 'Database',
    description: 'Browse all heroes, their roles, classes, tiers, and detailed statistics.',
  },
]

const recommendedHeroes = computed(() => {
  if (!quickPick.lastResult?.success || !quickPick.lastResult?.groups?.length) return []

  const bestGroup = quickPick.lastResult.groups[0]
  if (!bestGroup?.baseMembers) return []

  return bestGroup.baseMembers.map((name: string) => {
    return (
      sheetsStore.heroesList.find((h) => h.name === name) || {
        name: name || 'Unknown Hero',
        role: null,
        class: 'Unknown',
        counter: '',
      }
    )
  })
})

const hasAlternatives = computed(() => {
  return !!(
    quickPick.lastResult?.groups?.[0]?.slotAlternatives?.length &&
    quickPick.lastResult.groups[0].slotAlternatives[0]?.alternatives?.length
  )
})

const alternatives = computed(() => {
  if (!hasAlternatives.value) return []
  return quickPick.lastResult!.groups[0].slotAlternatives[0].alternatives.slice(0, 6)
})

const isEmptyResult = computed(() => {
  return (
    quickPick.lastResult?.success &&
    (!quickPick.lastResult.teams?.length || !quickPick.lastResult.groups?.length)
  )
})

const handleRoleChange = (role: 'sup' | 'dps' | 'tnk' | 'flx', delta: number) => {
  if (delta > 0 && totalTeamSize.value >= limits.totalTeam) {
    toast.add({
      title: 'Team limit reached',
      description: `You already have ${myHeroesCount.value} heroes selected. Total team size cannot exceed 6.`,
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
      timeout: 4000,
    })
    return
  }

  if (delta < 0 && quickPick.roleCounts[role] <= 0) {
    return
  }

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
    <!-- 🔙 Кнопка возврата на главную -->
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

    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between gap-4">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold">Quick Team Builder</h1>
        <p class="text-gray-500 dark:text-gray-400">
          Mark enemies, your heroes, and roles — the generator will build a lineup considering
          tiers, synergies, and counter-picks.
        </p>
      </div>
    </div>

    <!-- 🛡️ Глобальная ошибка загрузки данных -->
    <UAlert v-if="sheetsStore.error" color="error" variant="soft" :title="sheetsStore.error">
      <template #actions>
        <UButton color="error" variant="outline" size="xs" @click="sheetsStore.loadData()">
          Retry
        </UButton>
      </template>
    </UAlert>

    <!-- 🛡️ Состояние загрузки данных -->
    <div
      v-if="sheetsStore.isLoading"
      class="flex flex-col items-center justify-center py-20 space-y-4"
    >
      <UIcon name="i-lucide-loader-2" class="animate-spin size-10 text-primary-500" />
      <p class="text-gray-500 dark:text-gray-400">Loading data from sheets...</p>
    </div>

    <!-- 🛡️ Состояние: данных нет -->
    <div v-else-if="!sheetsStore.heroesList.length" class="text-center py-20 text-gray-500">
      Hero list is empty. Please check Google Sheets connection.
    </div>

    <!-- Основной контент (показываем только если данные загружены) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Hero List -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="font-semibold">Heroes</span>

              <!-- 📖 Legend -->
              <div
                class="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
              >
                <div class="flex items-center gap-1" title="Enemy">
                  <UIcon name="i-lucide-swords" class="size-4 text-error-500" />
                  <span>Enemy</span>
                </div>
                <div class="flex items-center gap-1" title="My Hero">
                  <UIcon name="i-lucide-shield-check" class="size-4 text-success-500" />
                  <span>Ally</span>
                </div>
                <div class="flex items-center gap-1" title="Key Enemy">
                  <UIcon name="i-lucide-star" class="size-4 text-warning-500" />
                  <span>Key enemy</span>
                </div>
                <div class="flex items-center gap-1" title="Ban">
                  <UIcon name="i-lucide-ban" class="size-4 text-gray-500" />
                  <span>Banned</span>
                </div>
              </div>
            </div>

            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Search hero..."
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
              <!-- Enemy -->
              <UTooltip text="Mark as enemy" :popper="{ placement: 'top' }">
                <UButton
                  icon="i-lucide-swords"
                  size="xs"
                  :color="quickPick.selectedEnemies.includes(hero.name) ? 'error' : 'neutral'"
                  :variant="quickPick.selectedEnemies.includes(hero.name) ? 'solid' : 'ghost'"
                  :disabled="!canAddEnemy && !quickPick.selectedEnemies.includes(hero.name)"
                  @click="quickPick.toggleEnemy(hero.name)"
                />
              </UTooltip>

              <!-- My Hero -->
              <UTooltip text="Add to my team" :popper="{ placement: 'top' }">
                <UButton
                  icon="i-lucide-shield-check"
                  size="xs"
                  :color="quickPick.selectedMyHeroes.includes(hero.name) ? 'success' : 'neutral'"
                  :variant="quickPick.selectedMyHeroes.includes(hero.name) ? 'solid' : 'ghost'"
                  :disabled="!canAddAlly && !quickPick.selectedMyHeroes.includes(hero.name)"
                  @click="quickPick.toggleMyHero(hero.name)"
                />
              </UTooltip>

              <!-- Key Enemy -->
              <UTooltip text="Mark as key enemy" :popper="{ placement: 'top' }">
                <UButton
                  icon="i-lucide-star"
                  size="xs"
                  :color="quickPick.starredEnemies.includes(hero.name) ? 'warning' : 'neutral'"
                  :variant="quickPick.starredEnemies.includes(hero.name) ? 'solid' : 'ghost'"
                  :disabled="!canAddStar && !quickPick.starredEnemies.includes(hero.name)"
                  @click="quickPick.toggleStar(hero.name)"
                />
              </UTooltip>

              <!-- Ban -->
              <UTooltip text="Ban hero" :popper="{ placement: 'top' }">
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
            No heroes found
          </div>
        </div>
      </UCard>

      <!-- Generation Settings -->
      <div class="space-y-6">
        <UCard>
          <template #header>
            <span class="font-semibold">Roles to Draft</span>
          </template>

          <div class="space-y-3">
            <div
              v-for="role in ['sup', 'dps', 'tnk', 'flx'] as const"
              :key="role"
              class="flex items-center justify-between"
            >
              <span class="text-sm">
                {{
                  role === 'sup'
                    ? 'Support'
                    : role === 'dps'
                      ? 'Damage'
                      : role === 'tnk'
                        ? 'Tank'
                        : 'Flex'
                }}
              </span>
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
              text="Maximum team size (6) reached. Remove a hero or role to add more."
              :disabled="totalTeamSize < 6"
              :content="{ side: 'top' }"
            >
              <div class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-xs font-medium transition-colors text-gray-500">
                    Total: {{ totalTeamSize }} / 6
                  </span>
                  <span class="text-[10px] text-gray-400">
                    ({{ myHeroesCount }} heroes + {{ draftedRolesCount }} roles)
                  </span>
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
            <span class="font-semibold">Parameters</span>
          </template>

          <div class="space-y-2">
            <UCheckbox
              v-model="quickPick.options.useSynergies"
              label="Synergies"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useSoloSynergies"
              label="Solo Synergies"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useTiers"
              label="Consider Tiers"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useCounterPicks"
              label="Counter-picks"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useClassWeights"
              label="Class Weights"
              :disabled="quickPick.isLoading"
            />
            <UCheckbox
              v-model="quickPick.options.useAntiRoleWeights"
              label="Anti-role Weights"
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
              {{ quickPick.isLoading ? 'Generating...' : 'Generate' }}
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              block
              :icon="quickPick.isLoading ? '' : 'i-lucide-rotate-ccw'"
              :disabled="quickPick.isLoading"
              @click="quickPick.clearAll"
            >
              Clear
            </UButton>
          </div>

          <p
            v-if="totalTeamSize === 0"
            class="text-xs text-center text-amber-600 dark:text-amber-400 font-medium"
          >
            Select at least one hero or role to generate a team
          </p>

          <UAlert v-if="quickPick.error" color="error" variant="soft" :title="quickPick.error" />
        </div>
      </div>
    </div>

    <!-- 🛡️ Generation Result -->
    <div v-if="quickPick.lastResult">
      <UCard v-if="isEmptyResult" color="warning" variant="soft">
        <template #header>
          <span
            class="font-semibold flex items-center gap-2 text-warning-700 dark:text-warning-400"
          >
            <UIcon name="i-lucide-alert-triangle" class="size-5" />
            No teams found
          </span>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          No valid combinations found for the selected heroes and roles. Try changing the
          composition or removing some constraints.
        </p>
      </UCard>

      <UCard v-else class="border-primary-200 dark:border-primary-800 ring-1 ring-primary-500/20">
        <template #header>
          <div class="flex items-center justify-between">
            <span
              class="font-semibold flex items-center gap-2 text-primary-700 dark:text-primary-400"
            >
              <UIcon name="i-lucide-sparkles" class="size-5" />
              Result
            </span>
            <UBadge color="primary" variant="subtle" size="sm">
              ⏱️ {{ quickPick.lastResult.stats?.duration || '0.00' }}s • 🔍
              {{ quickPick.lastResult.stats?.iterations || 0 }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-6">
          <div v-if="recommendedHeroes.length > 0">
            <h3
              class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
            >
              <UIcon name="i-lucide-thumbs-up" class="size-4 text-green-500" />
              Recommended heroes for your team
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="hero in recommendedHeroes"
                :key="hero.name"
                class="rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20 p-3 flex flex-col gap-2 relative transition-all hover:shadow-md"
              >
                <div
                  class="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm"
                >
                  TOP
                </div>

                <div class="flex items-center justify-between pr-8">
                  <span
                    class="text-sm font-bold text-gray-900 dark:text-white truncate"
                    :title="hero.name"
                  >
                    {{ hero.name }}
                  </span>
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

                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ hero.class || 'Unknown' }}
                  <span v-if="hero.counter">/ {{ hero.counter }}</span>
                </div>
                <UButton
                  block
                  size="sm"
                  color="primary"
                  variant="soft"
                  :icon="quickPick.selectedMyHeroes.includes(hero.name) ? '' : 'i-lucide-plus'"
                  :disabled="quickPick.selectedMyHeroes.includes(hero.name) || quickPick.isLoading"
                  @click="handleAddRecommendedHero(hero.name, hero.role)"
                >
                  {{
                    quickPick.selectedMyHeroes.includes(hero.name)
                      ? 'Already in Team'
                      : 'Add to Team'
                  }}
                </UButton>
              </div>
            </div>
          </div>

          <div v-if="hasAlternatives" class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3
              class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
            >
              <UIcon name="i-lucide-shuffle" class="size-4 text-gray-500" />
              Alternative options (substitutes)
            </h3>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="alt in alternatives"
                :key="alt.name"
                size="xs"
                variant="ghost"
                color="neutral"
                :disabled="quickPick.selectedMyHeroes.includes(alt.name) || quickPick.isLoading"
                @click="quickPick.toggleMyHero(alt.name)"
              >
                {{ alt.name }}
                <span class="ml-1 text-[10px] opacity-70">({{ alt.bestScore }})</span>
              </UButton>
            </div>
          </div>

          <details
            class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <summary
              class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 list-none flex justify-between items-center transition-colors"
            >
              <span class="flex items-center gap-2">
                <UIcon name="i-lucide-bar-chart-2" class="size-4" />
                Show evaluation details
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                class="size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <div
              class="p-4 text-xs space-y-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
            >
              <div
                v-html="
                  quickPick.lastResult?.groups?.[0]?.bestTeam?.formattedDetails ||
                  'Evaluation details are not available'
                "
              />
            </div>
          </details>
        </div>
      </UCard>
    </div>

    <!-- Links to other tools -->
    <div class="space-y-3 pt-4">
      <h2 class="text-xl font-semibold">Other Tools</h2>
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
