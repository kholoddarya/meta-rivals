<script setup lang="ts">
const toast = useToast()
const quickPick = useQuickPickStore()

const limits = { totalTeam: 6, maxPerRole: 3, maxFlx: 3 }

const myHeroesCount = computed(() => quickPick.selectedMyHeroes.length)
const draftedRolesCount = computed(
  () =>
    quickPick.roleCounts.sup +
    quickPick.roleCounts.dps +
    quickPick.roleCounts.tnk +
    quickPick.roleCounts.flx
)
const totalTeamSize = computed(() => myHeroesCount.value + draftedRolesCount.value)

const canAddRole = (role: 'sup' | 'dps' | 'tnk' | 'flx') => {
  if (totalTeamSize.value >= limits.totalTeam) return false
  const max = role === 'flx' ? limits.maxFlx : limits.maxPerRole
  return quickPick.roleCounts[role] < max
}

const canRemoveRole = (role: 'sup' | 'dps' | 'tnk' | 'flx') => quickPick.roleCounts[role] > 0

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
  if (delta < 0 && quickPick.roleCounts[role] <= 0) return
  quickPick.changeRole(role, delta)
}
</script>

<template>
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
          <span class="w-4 text-center text-sm font-medium">{{ quickPick.roleCounts[role] }}</span>
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
        <div class="flex items-center justify-between cursor-help">
          <div class="flex flex-col">
            <span
              class="text-xs font-medium transition-colors"
              :class="totalTeamSize >= 6 ? 'text-red-500 font-bold' : 'text-gray-500'"
            >
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
</template>
