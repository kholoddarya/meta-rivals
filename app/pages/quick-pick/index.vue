<script setup lang="ts">
import { useI18n } from '#i18n'

const { t } = useI18n()
const sheetsStore = useSheetsStore()
const quickPick = useQuickPickStore()

const search = ref('')

onMounted(() => {
  sheetsStore.loadData()
})

const filteredHeroes = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return sheetsStore.heroesList
  return sheetsStore.heroesList.filter((h) => h.name.toLowerCase().includes(q))
})

const roleColors: Record<'sup' | 'dps' | 'tnk' | 'flx', string> = {
  sup: 'success',
  dps: 'error',
  tnk: 'info',
  flx: 'warning',
}

function heroStatus(name: string) {
  if (quickPick.bannedHeroes.includes(name)) return 'banned'
  if (quickPick.selectedEnemies.includes(name)) return 'enemy'
  if (quickPick.selectedMyHeroes.includes(name)) return 'ally'
  return 'none'
}

// Делаем массив реактивным, чтобы он обновлялся при смене языка
const otherPages = computed(() => [
  {
    to: '/quick-pick/duo',
    icon: 'i-lucide-users',
    title: t('pages.duo.title'),
    description: t('pages.duo.description'),
  },
  {
    to: '/quick-pick/trio',
    icon: 'i-lucide-users-round',
    title: t('pages.trio.title'),
    description: t('pages.trio.description'),
  },
  {
    to: '/quick-pick/quadro',
    icon: 'i-lucide-user-plus',
    title: t('pages.quadro.title'),
    description: t('pages.quadro.description'),
  },
  {
    to: '/quick-pick/team',
    icon: 'i-lucide-shield',
    title: t('pages.team.title'),
    description: t('pages.team.description'),
  },
  {
    to: '/quick-pick/teamups',
    icon: 'i-lucide-flame',
    title: t('pages.teamups.title'),
    description: t('pages.teamups.description'),
  },
])
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-8">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold">{{ $t('title') }}</h1>
      <p class="text-gray-500 dark:text-gray-400">
        {{ $t('subtitle') }}
      </p>
    </div>

    <UAlert v-if="sheetsStore.error" color="error" variant="soft" :title="sheetsStore.error" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Hero List -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <span class="font-semibold">{{ $t('heroes') }}</span>
            <UInput
              v-model="search"
              icon="i-lucide-search"
              :placeholder="$t('searchPlaceholder')"
              class="w-48"
            />
          </div>
        </template>

        <div v-if="sheetsStore.isLoading" class="flex justify-center py-10">
          <UIcon name="i-lucide-loader-2" class="animate-spin size-6 text-gray-400" />
        </div>

        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[520px] overflow-y-auto pr-1"
        >
          <div
            v-for="hero in filteredHeroes"
            :key="hero.name"
            class="rounded-lg border p-2 flex flex-col gap-1"
            :class="{
              'border-red-400 bg-red-50 dark:bg-red-950/30': heroStatus(hero.name) === 'enemy',
              'border-green-400 bg-green-50 dark:bg-green-950/30': heroStatus(hero.name) === 'ally',
              'border-gray-300 opacity-40': heroStatus(hero.name) === 'banned',
              'border-gray-200 dark:border-gray-700': heroStatus(hero.name) === 'none',
            }"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium truncate">{{ hero.name }}</span>
              <UBadge v-if="hero.role" :color="roleColors[hero.role]" variant="subtle" size="xs">
                {{ $t(`roles.${hero.role}`) }}
              </UBadge>
            </div>

            <div class="flex items-center gap-1">
              <UButton
                icon="i-lucide-swords"
                size="xs"
                :color="quickPick.selectedEnemies.includes(hero.name) ? 'error' : 'neutral'"
                :variant="quickPick.selectedEnemies.includes(hero.name) ? 'solid' : 'ghost'"
                :title="$t('tooltip.enemy')"
                @click="quickPick.toggleEnemy(hero.name)"
              />
              <UButton
                icon="i-lucide-shield-check"
                size="xs"
                :color="quickPick.selectedMyHeroes.includes(hero.name) ? 'success' : 'neutral'"
                :variant="quickPick.selectedMyHeroes.includes(hero.name) ? 'solid' : 'ghost'"
                :title="$t('tooltip.ally')"
                @click="quickPick.toggleMyHero(hero.name)"
              />
              <UButton
                icon="i-lucide-star"
                size="xs"
                :color="quickPick.starredEnemies.includes(hero.name) ? 'warning' : 'neutral'"
                :variant="quickPick.starredEnemies.includes(hero.name) ? 'solid' : 'ghost'"
                :title="$t('tooltip.keyEnemy')"
                @click="quickPick.toggleStar(hero.name)"
              />
              <UButton
                icon="i-lucide-ban"
                size="xs"
                :color="quickPick.bannedHeroes.includes(hero.name) ? 'neutral' : 'neutral'"
                :variant="quickPick.bannedHeroes.includes(hero.name) ? 'solid' : 'ghost'"
                :title="$t('tooltip.ban')"
                @click="quickPick.toggleBan(hero.name)"
              />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Generation Settings -->
      <div class="space-y-6">
        <UCard>
          <template #header>
            <span class="font-semibold">{{ $t('rolesToDraft') }}</span>
          </template>

          <div class="space-y-3">
            <div
              v-for="role in ['sup', 'dps', 'tnk', 'flx'] as const"
              :key="role"
              class="flex items-center justify-between"
            >
              <span class="text-sm">{{ $t(`roles.${role}`) }}</span>
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-minus"
                  size="xs"
                  variant="soft"
                  @click="quickPick.changeRole(role, -1)"
                />
                <span class="w-4 text-center text-sm">{{ quickPick.roleCounts[role] }}</span>
                <UButton
                  icon="i-lucide-plus"
                  size="xs"
                  variant="soft"
                  @click="quickPick.changeRole(role, 1)"
                />
              </div>
            </div>
          </div>

          <template #footer>
            <span class="text-xs text-gray-500">{{
              $t('totalRoles', { count: quickPick.totalRoles })
            }}</span>
          </template>
        </UCard>

        <UCard>
          <template #header>
            <span class="font-semibold">{{ $t('parameters') }}</span>
          </template>

          <div class="space-y-2">
            <UCheckbox v-model="quickPick.options.useSynergies" :label="$t('param.synergies')" />
            <UCheckbox
              v-model="quickPick.options.useSoloSynergies"
              :label="$t('param.soloSynergies')"
            />
            <UCheckbox v-model="quickPick.options.useTiers" :label="$t('param.tiers')" />
            <UCheckbox
              v-model="quickPick.options.useCounterPicks"
              :label="$t('param.counterPicks')"
            />
            <UCheckbox
              v-model="quickPick.options.useClassWeights"
              :label="$t('param.classWeights')"
            />
            <UCheckbox
              v-model="quickPick.options.useAntiRoleWeights"
              :label="$t('param.antiRoleWeights')"
            />
          </div>
        </UCard>

        <div class="flex gap-2">
          <UButton
            block
            :loading="quickPick.isLoading"
            :disabled="quickPick.totalRoles === 0"
            icon="i-lucide-wand-2"
            @click="quickPick.generateTeams"
          >
            {{ $t('generate') }}
          </UButton>
          <UButton
            color="neutral"
            variant="soft"
            :icon="quickPick.isLoading ? '' : 'i-lucide-rotate-ccw'"
            :disabled="quickPick.isLoading"
            @click="quickPick.clearAll"
          >
            {{ $t('clear') }}
          </UButton>
        </div>

        <UAlert v-if="quickPick.error" color="error" variant="soft" :title="quickPick.error" />
      </div>
    </div>

    <!-- Generation Result -->
    <UCard v-if="quickPick.lastResult">
      <template #header>
        <span class="font-semibold">{{ $t('result') }}</span>
      </template>
      <pre class="text-xs overflow-x-auto">{{ quickPick.lastResult }}</pre>
    </UCard>

    <!-- Links to other tools -->
    <div class="space-y-3">
      <h2 class="text-xl font-semibold">{{ $t('otherTools') }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink v-for="page in otherPages" :key="page.to" :to="page.to">
          <UCard class="h-full hover:ring-2 hover:ring-primary-500 transition">
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
