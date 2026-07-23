<script setup lang="ts">
import { h, onMounted, computed, ref } from 'vue'
import type { AccordionItem, TableColumn } from '@nuxt/ui'
import { useSheetsStore } from '~/stores/sheets'
import { UPopover } from '#components'

const store = useSheetsStore()
const teamUpSearch = ref('')

onMounted(() => {
  store.loadData()
})

function formatColumnName(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
}

const tierLegend = [
  {
    key: 'SA',
    label: 'Top with anchor',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  {
    key: 'S',
    label: 'Meta',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    key: 'A',
    label: 'Strong',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    key: 'B',
    label: 'Solid',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-500 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    key: 'C',
    label: 'Average',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-500 dark:text-orange-200',
    border: 'border-orange-200 dark:border-orange-800',
  },
  {
    key: 'D',
    label: 'Weak',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-400 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
]

const tierColors: Record<string, string> = {
  SA: 'text-purple-600 dark:text-purple-400 font-bold',
  S: 'text-blue-600 dark:text-blue-400 font-semibold',
  A: 'text-green-600 dark:text-green-400 font-semibold',
  B: 'text-amber-500 dark:text-amber-200 font-medium',
  C: 'text-orange-500 dark:text-orange-200 font-medium',
  D: 'text-red-400 dark:text-red-300 font-medium',
  'N/A': 'text-gray-400 dark:text-gray-500',
  '': 'text-gray-400 dark:text-gray-500',
}

function getTierStyle(grade: string) {
  return (
    tierLegend.find((t) => t.key === grade) || {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-500 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700',
    }
  )
}

function buildColumns(data: Record<string, any>[]): TableColumn<Record<string, any>>[] {
  if (!data.length) return []
  return Object.keys(data[0]).map((key, index) => {
    const isNameColumn = index === 0
    const column: TableColumn<Record<string, any>> = {
      accessorKey: key,
      header: formatColumnName(key),
      size: isNameColumn ? 180 : 120,
      meta: {
        class: { td: isNameColumn ? 'font-medium text-gray-900 dark:text-white' : undefined },
      },
    }
    column.cell = ({ row }: any) => {
      const value = row.getValue(key)
      const strValue = String(value ?? '').trim()
      const upperValue = strValue.toUpperCase()
      const colorClass = isNameColumn
        ? ''
        : tierColors[upperValue] || 'text-gray-700 dark:text-gray-300'
      return h('span', { class: colorClass }, strValue || '—')
    }
    return column
  })
}

function pinFirstColumn(columns: TableColumn<Record<string, any>>[]) {
  const firstKey = columns[0]?.accessorKey as string | undefined
  return firstKey ? { left: [firstKey] } : { left: [] }
}

const fullInfoColumns = computed(() => buildColumns(store.fullInfo))
const heroTierColumns = computed(() => buildColumns(store.heroTier))
const classColumns = computed(() => buildColumns(store.classData))

const fullInfoPinning = computed(() => pinFirstColumn(fullInfoColumns.value))
const heroTierPinning = computed(() => pinFirstColumn(heroTierColumns.value))
const classPinning = computed(() => pinFirstColumn(classColumns.value))

const filteredTeamUps = computed(() => {
  if (!teamUpSearch.value) return store.teamUps
  const q = teamUpSearch.value.toLowerCase()
  return store.teamUps.filter(
    (item) => item.heroA.toLowerCase().includes(q) || item.heroB.toLowerCase().includes(q)
  )
})

const teamUpColumns: TableColumn<any>[] = [
  {
    accessorKey: 'heroA',
    header: 'Hero A',
    size: 150,
    cell: ({ row }: any) =>
      h('span', { class: 'font-medium text-gray-900 dark:text-white' }, row.getValue('heroA')),
  },
  {
    accessorKey: 'roleA',
    header: 'Role',
    size: 70,
    cell: ({ row }: any) =>
      h(
        'span',
        { class: 'text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold' },
        row.getValue('roleA')
      ),
  },
  {
    accessorKey: 'tierA',
    header: 'Tier',
    size: 60,
    cell: ({ row }: any) => {
      const tier = String(row.getValue('tierA')).toUpperCase()
      return h('span', { class: tierColors[tier] || 'text-gray-500' }, tier)
    },
  },
  {
    accessorKey: 'heroB',
    header: 'Hero B',
    size: 150,
    cell: ({ row }: any) =>
      h('span', { class: 'font-medium text-gray-900 dark:text-white' }, row.getValue('heroB')),
  },
  {
    accessorKey: 'roleB',
    header: 'Role',
    size: 70,
    cell: ({ row }: any) =>
      h(
        'span',
        { class: 'text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold' },
        row.getValue('roleB')
      ),
  },
  {
    accessorKey: 'tierB',
    header: 'Tier',
    size: 60,
    cell: ({ row }: any) => {
      const tier = String(row.getValue('tierB')).toUpperCase()
      return h('span', { class: tierColors[tier] || 'text-gray-500' }, tier)
    },
  },
  {
    accessorKey: 'grade',
    header: 'Grade',
    size: 90,
    cell: ({ row }: any) => {
      const item = row.original
      // Получаем значение максимально надежно, защищаясь от undefined/null
      const grade = String(item.grade ?? row.getValue('grade') ?? '')
        .toUpperCase()
        .trim()

      if (!grade) {
        return h('span', { class: 'text-gray-400 text-xs' }, '—')
      }

      const style = getTierStyle(grade)

      return h('div', { class: 'relative inline-block' }, [
        h(
          UPopover,
          { mode: 'hover' },
          {
            default: () =>
              h(
                'span',
                {
                  class: `inline-flex items-center justify-center w-8 h-6 rounded border font-bold text-xs cursor-help transition-colors ${style.bg} ${style.text} ${style.border}`,
                },
                grade
              ),
            content: () =>
              h('div', { class: 'p-3 w-72 space-y-2' }, [
                h('div', { class: 'flex items-center justify-between' }, [
                  h(
                    'h4',
                    { class: 'font-semibold text-sm text-gray-900 dark:text-white' },
                    `${item.heroA} + ${item.heroB}`
                  ),
                ]),
                h(
                  'p',
                  { class: 'text-xs text-gray-600 dark:text-gray-300 leading-relaxed' },
                  `Synergy: ${item.synergyScore} | Tier: ${item.tierScore} | Role: ${item.roleScore}`
                ),
                h('div', { class: 'flex flex-wrap gap-1.5 pt-1' }, [
                  h(
                    'span',
                    {
                      class:
                        'text-[10px] px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full border border-primary-100 dark:border-primary-800',
                    },
                    `Total Score: ${item.totalScore}`
                  ),
                ]),
              ]),
          }
        ),
      ])
    },
  },
  {
    accessorKey: 'totalScore',
    header: 'Total',
    size: 70,
    cell: ({ row }: any) =>
      h('span', { class: 'font-bold text-gray-900 dark:text-white' }, row.getValue('totalScore')),
  },
]
// 🎯 Вкладка Team-Ups перемещена на второе место (индекс 1)
const items = computed<AccordionItem[]>(() => [
  { label: 'All Team-Ups', icon: 'i-lucide-flame', value: 'teamUps', slot: 'teamUps' as const },
  { label: 'Full Info', icon: 'i-lucide-table-2', value: 'fullInfo', slot: 'fullInfo' as const },
  {
    label: 'Hero Tier List',
    icon: 'i-lucide-bar-chart-3',
    value: 'heroTier',
    slot: 'heroTier' as const,
  },
  { label: 'Classes', icon: 'i-lucide-shapes', value: 'class', slot: 'class' as const },
])
</script>

<template>
  <div class="mx-4 sm:mx-10 lg:mx-20 px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex justify-between items-center mb-6">
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
      <ThemeToggle />
    </div>

    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Meta Rivals: Database</h1>
    </header>

    <div class="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      <span class="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider"
        >Tiers:</span
      >
      <template v-for="tier in tierLegend" :key="tier.key">
        <div class="flex items-center gap-1.5">
          <span
            class="inline-flex items-center justify-center w-6 h-5 rounded border font-bold text-[10px] leading-none"
            :class="[tier.bg, tier.text, tier.border]"
          >
            {{ tier.key }}
          </span>
          <span class="text-gray-600 dark:text-gray-400">{{ tier.label }}</span>
        </div>
      </template>
      <div class="flex items-center gap-1.5">
        <span
          class="inline-flex items-center justify-center w-8 h-5 rounded border font-medium text-[10px] leading-none bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
          >N/A</span
        >
        <span class="text-gray-600 dark:text-gray-400">None</span>
      </div>
    </div>

    <div
      v-if="store.isLoading"
      class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 mb-4" />
      <p>Loading data from sheets...</p>
    </div>

    <UAlert
      v-else-if="store.error"
      color="error"
      variant="soft"
      :title="store.error"
      icon="i-lucide-alert-triangle"
    >
      <template #actions>
        <UButton color="error" variant="outline" size="xs" @click="store.loadData()">Retry</UButton>
      </template>
    </UAlert>

    <UAccordion
      v-else
      type="multiple"
      :items="items"
      :default-value="['teamUps']"
      :unmount-on-hide="false"
    >
      <template #teamUps>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Hover over the
              <span class="font-semibold text-gray-700 dark:text-gray-300">Grade</span> badge to see
              synergy details.
            </p>
            <UInput
              v-model="teamUpSearch"
              icon="i-lucide-search"
              placeholder="Search hero..."
              class="w-64"
              size="sm"
            />
          </div>

          <UTable
            :data="filteredTeamUps"
            :columns="teamUpColumns"
            sticky
            class="max-h-[600px]"
            :ui="{ td: 'py-3' }"
          />

          <p
            v-if="!filteredTeamUps || filteredTeamUps.length === 0"
            class="text-center py-10 text-gray-500 dark:text-gray-400 text-sm"
          >
            No team-ups match your search.
          </p>
        </div>
      </template>

      <template #fullInfo>
        <UTable
          :data="store.fullInfo"
          :columns="fullInfoColumns"
          :column-pinning="fullInfoPinning"
          sticky
          class="max-h-[600px]"
        />
      </template>

      <template #heroTier>
        <UTable
          :data="store.heroTier"
          :columns="heroTierColumns"
          :column-pinning="heroTierPinning"
          sticky
          class="max-h-[600px]"
        />
      </template>

      <template #class>
        <UTable
          :data="store.classData"
          :columns="classColumns"
          :column-pinning="classPinning"
          sticky
          class="max-h-[600px]"
        />
      </template>
    </UAccordion>
  </div>
</template>
