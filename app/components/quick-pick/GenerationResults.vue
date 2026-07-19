<script setup lang="ts">
const sheetsStore = useSheetsStore()
const quickPick = useQuickPickStore()

const recommendedHeroes = computed(() => {
  if (!quickPick.lastResult?.success || !quickPick.lastResult?.groups?.length) return []
  const bestGroup = quickPick.lastResult.groups[0]
  if (!bestGroup?.baseMembers) return []
  return bestGroup.baseMembers.map(
    (name: string) =>
      sheetsStore.heroesList.find((h) => h.name === name) || {
        name: name || 'Unknown',
        role: null,
        class: 'Unknown',
        counter: '',
      }
  )
})

const hasAlternatives = computed(
  () =>
    !!(
      quickPick.lastResult?.groups?.[0]?.slotAlternatives?.length &&
      quickPick.lastResult.groups[0].slotAlternatives[0]?.alternatives?.length
    )
)

const alternatives = computed(() => {
  if (!hasAlternatives.value) return []
  return quickPick.lastResult!.groups[0].slotAlternatives[0].alternatives.slice(0, 6)
})

const isEmptyResult = computed(
  () =>
    quickPick.lastResult?.success &&
    (!quickPick.lastResult.teams?.length || !quickPick.lastResult.groups?.length)
)

const roleColors: Record<'sup' | 'dps' | 'tnk' | 'flx' | 'unknown', string> = {
  sup: 'success',
  dps: 'error',
  tnk: 'info',
  flx: 'warning',
  unknown: 'neutral',
}
</script>

<template>
  <div v-if="quickPick.lastResult">
    <UCard v-if="isEmptyResult" color="warning" variant="soft">
      <template #header>
        <span class="font-semibold flex items-center gap-2 text-warning-700 dark:text-warning-400">
          <UIcon name="i-lucide-alert-triangle" class="size-5" /> No teams found
        </span>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        No valid combinations found for the selected heroes and roles. Try changing the composition
        or removing some constraints.
      </p>
    </UCard>

    <UCard v-else class="border-primary-200 dark:border-primary-800 ring-1 ring-primary-500/20">
      <template #header>
        <div class="flex items-center justify-between">
          <span
            class="font-semibold flex items-center gap-2 text-primary-700 dark:text-primary-400"
          >
            <UIcon name="i-lucide-sparkles" class="size-5" /> Result
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
            <UIcon name="i-lucide-thumbs-up" class="size-4 text-green-500" /> Recommended heroes for
            your team
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
                  >{{ hero.name }}</span
                >
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
                {{ hero.class || 'Unknown' }} <span v-if="hero.counter">/ {{ hero.counter }}</span>
              </div>
              <UButton
                block
                size="sm"
                color="primary"
                variant="soft"
                icon="i-lucide-plus"
                :disabled="quickPick.selectedMyHeroes.includes(hero.name) || quickPick.isLoading"
                @click="quickPick.toggleMyHero(hero.name)"
              >
                {{
                  quickPick.selectedMyHeroes.includes(hero.name) ? 'Already in Team' : 'Add to Team'
                }}
              </UButton>
            </div>
          </div>
        </div>

        <div v-if="hasAlternatives" class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3
            class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
          >
            <UIcon name="i-lucide-shuffle" class="size-4 text-gray-500" /> Alternative options
            (substitutes)
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
              {{ alt.name }} <span class="ml-1 text-[10px] opacity-70">({{ alt.bestScore }})</span>
            </UButton>
          </div>
        </div>

        <details
          class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <summary
            class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 list-none flex justify-between items-center transition-colors"
          >
            <span class="flex items-center gap-2"
              ><UIcon name="i-lucide-bar-chart-2" class="size-4" /> Show evaluation details</span
            >
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
</template>
