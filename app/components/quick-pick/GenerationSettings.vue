<script setup lang="ts">
const sheetsStore = useSheetsStore()
const quickPick = useQuickPickStore()

const totalTeamSize = computed(
  () =>
    quickPick.selectedMyHeroes.length +
    quickPick.roleCounts.sup +
    quickPick.roleCounts.dps +
    quickPick.roleCounts.tnk +
    quickPick.roleCounts.flx
)
</script>

<template>
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
</template>
