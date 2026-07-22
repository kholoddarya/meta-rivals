<script setup lang="ts">
import type { RoleType } from '~/types/sheets'

interface TeamUpInfo {
  partner: string
  role: RoleType | null
  tier: string | null
  grade: string
  synergyScore: number
  description: {
    title: string
    text: string
    bonuses: string[]
  } | null
}

// Исправлено: убраны фигурные скобки
const sheetsStore = useSheetsStore()
const selectedHero = ref<string>('')
const teamups = ref<TeamUpInfo[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const heroData = ref<{ name: string; role: RoleType | null; tier: string | null } | null>(null)
const expandedTeamup = ref<string | null>(null)

const gradeStyles: Record<string, { label: string; class: string }> = {
  SA: {
    label: 'SA',
    class: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  },
  S: { label: 'S', class: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  A: { label: 'A', class: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300' },
  B: { label: 'B', class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  C: { label: 'C', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
}

const roleLabels: Record<RoleType, string> = { sup: 'Support', dps: 'Damage', tnk: 'Tank' }
const roleColors: Record<RoleType, string> = { sup: 'success', dps: 'error', tnk: 'info' }

const heroOptions = computed(() => {
  if (!sheetsStore?.heroesList?.length) return []
  return sheetsStore.heroesList.map((h) => ({
    value: h.name,
    label: h.name,
    role: h.role,
  }))
})

const loadTeamups = async (heroName: string) => {
  if (!heroName) {
    teamups.value = []
    heroData.value = null
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const res = await $fetch<{ teamups: TeamUpInfo[]; hero: string }>(
      `/api/teamups/${encodeURIComponent(heroName)}`
    )
    teamups.value = res.teamups

    const heroInfo = sheetsStore.heroesList.find((h) => h.name === res.hero)
    heroData.value = heroInfo || { name: res.hero, role: null, tier: null }

    if (res.teamups.length > 0) {
      expandedTeamup.value = res.teamups[0].partner
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load team-ups'
    teamups.value = []
    heroData.value = null
  } finally {
    isLoading.value = false
  }
}

const heroInitial = (name: string) => {
  return name.trim().charAt(0).toUpperCase()
}

const getHeroIconUrl = (heroName: string): string => {
  const sanitizedName = heroName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return `https://marvelrivals.gg/static/images/heroes/${sanitizedName}.png`
  // Примечание: URL иконок зависит от структуры marvelrivals.gg. Если не грузится, верните фоллбэк на fandom wiki.
}

const toggleExpand = (partner: string) => {
  expandedTeamup.value = expandedTeamup.value === partner ? null : partner
}

watch(selectedHero, (newVal) => {
  if (newVal) {
    loadTeamups(newVal)
  }
})

onMounted(() => {
  if (sheetsStore.heroesList.length === 0 && !sheetsStore.isLoading) {
    sheetsStore.loadData()
  }
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <header class="mb-8 text-center">
      <div
        class="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 mb-3"
      >
        <UIcon name="i-lucide-users" class="size-3.5" />
        Synergy Database
      </div>
      <h1 class="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Hero Team-Ups</h1>
      <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
        Select a hero to discover their best synergies and team-up potential with other characters.
      </p>
    </header>

    <!-- Hero Selector -->
    <div class="max-w-md mx-auto mb-10">
      <UInputMenu
        v-model="selectedHero"
        :items="heroOptions"
        placeholder="Search and select a hero..."
        :searchable="true"
        :clearable="true"
        class="w-full"
        :loading="sheetsStore.isLoading"
      >
        <template #label>
          <div v-if="selectedHero" class="flex items-center gap-2">
            <div
              class="size-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold"
            >
              {{ heroInitial(selectedHero) }}
            </div>
            <span>{{ selectedHero }}</span>
          </div>
        </template>
        <template #item="{ item }">
          <div class="flex items-center gap-3">
            <div
              class="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold"
            >
              {{ heroInitial(item.value) }}
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium">{{ item.label }}</div>
              <div v-if="item.role" class="text-xs text-gray-500 dark:text-gray-400">
                {{ roleLabels[item.role] }}
              </div>
            </div>
          </div>
        </template>
      </UInputMenu>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 mb-4" />
      <p>Loading team-ups...</p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
      icon="i-lucide-alert-triangle"
    />

    <!-- Selected Hero & Team-ups -->
    <div v-else-if="heroData && teamups.length > 0" class="space-y-6">
      <!-- Hero Header -->
      <UCard
        class="bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/20 dark:to-gray-900"
      >
        <div class="flex items-center gap-4">
          <div class="relative">
            <div
              class="size-20 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden"
            >
              <img
                :src="getHeroIconUrl(heroData.name)"
                :alt="heroData.name"
                class="size-full object-cover"
                @error="$el.style.display = 'none'"
              />
              <span class="text-3xl font-bold text-gray-700 dark:text-gray-200">
                {{ heroInitial(heroData.name) }}
              </span>
            </div>
            <UBadge
              v-if="heroData.role"
              :color="roleColors[heroData.role]"
              variant="solid"
              size="sm"
              class="absolute -bottom-1 -right-1"
            >
              {{ roleLabels[heroData.role] }}
            </UBadge>
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {{ heroData.name }}
            </h2>
            <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>{{ teamups.length }} team-ups found</span>
              <span v-if="heroData.tier">• Tier {{ heroData.tier }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Team-ups List -->
      <div class="space-y-3">
        <UCard
          v-for="(teamup, index) in teamups"
          :key="teamup.partner"
          class="overflow-hidden transition-all hover:shadow-md cursor-pointer"
          :class="[
            index < 3 ? 'ring-1 ring-primary-200 dark:ring-primary-800' : '',
            expandedTeamup === teamup.partner
              ? 'ring-2 ring-primary-500 dark:ring-primary-400'
              : '',
          ]"
          @click="toggleExpand(teamup.partner)"
        >
          <div class="flex items-center gap-4">
            <!-- Rank Badge -->
            <div v-if="index < 3" class="shrink-0">
              <div
                class="size-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold"
              >
                {{ index + 1 }}
              </div>
            </div>

            <!-- Partner Hero -->
            <div class="relative shrink-0">
              <div
                class="size-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden"
              >
                <img
                  :src="getHeroIconUrl(teamup.partner)"
                  :alt="teamup.partner"
                  class="size-full object-cover"
                  @error="$el.style.display = 'none'"
                />
                <span class="text-lg font-bold text-gray-700 dark:text-gray-200">
                  {{ heroInitial(teamup.partner) }}
                </span>
              </div>
              <UBadge
                v-if="teamup.role"
                :color="roleColors[teamup.role]"
                variant="subtle"
                size="xs"
                class="absolute -bottom-1 -right-1"
              >
                {{ roleLabels[teamup.role] }}
              </UBadge>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                {{ teamup.partner }}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span
                  :class="`text-xs font-bold px-2 py-0.5 rounded ${gradeStyles[teamup.grade]?.class || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`"
                >
                  {{ gradeStyles[teamup.grade]?.label || teamup.grade }}
                </span>
                <span v-if="teamup.tier" class="text-xs text-gray-500 dark:text-gray-400">
                  Tier {{ teamup.tier }}
                </span>
                <span
                  v-if="teamup.description"
                  class="text-xs text-primary-600 dark:text-primary-400 font-medium"
                >
                  • {{ teamup.description.title }}
                </span>
              </div>
            </div>

            <!-- Score & Expand Icon -->
            <div class="flex items-center gap-3 shrink-0">
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ teamup.synergyScore }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">points</div>
              </div>
              <UIcon
                name="i-lucide-chevron-down"
                class="size-5 text-gray-400 transition-transform"
                :class="{ 'rotate-180': expandedTeamup === teamup.partner }"
              />
            </div>
          </div>

          <!-- Expanded Description -->
          <div
            v-if="teamup.description && expandedTeamup === teamup.partner"
            class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {{ teamup.description.title }}
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {{ teamup.description.text }}
            </p>
            <div v-if="teamup.description.bonuses?.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="(bonus, idx) in teamup.description.bonuses"
                :key="idx"
                color="primary"
                variant="subtle"
                size="xs"
              >
                {{ bonus }}
              </UBadge>
            </div>
          </div>

          <!-- No Description Placeholder -->
          <div
            v-else-if="expandedTeamup === teamup.partner && !teamup.description"
            class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400 italic">
              Description not available yet. Check back later for updates!
            </p>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="selectedHero && !isLoading"
      class="text-center py-20 text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-lucide-user-x" class="size-12 mx-auto mb-4 opacity-50" />
      <p class="text-lg font-medium">No team-ups found for {{ selectedHero }}</p>
      <p class="text-sm mt-1">This hero might not have recorded synergies yet.</p>
    </div>
  </div>
</template>
