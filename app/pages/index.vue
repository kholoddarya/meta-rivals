<script setup lang="ts">
const { t } = useI18n()

const tools = [
  {
    name: t('home.tools.quick_pick'),
    path: '/quick-pick',
    icon: 'i-lucide-zap',
    color: 'primary',
    description: t('home.tools.quick_pick_desc'),
  },
  {
    name: t('home.tools.duo'),
    path: '/quick-pick/duo',
    icon: 'i-lucide-users',
    color: 'info',
    description: t('home.tools.duo_desc'),
  },
  {
    name: t('home.tools.trio'),
    path: '/quick-pick/trio',
    icon: 'i-lucide-users-round',
    color: 'success',
    description: t('home.tools.trio_desc'),
  },
  {
    name: t('home.tools.quadro'),
    path: '/quick-pick/quadro',
    icon: 'i-lucide-user-plus',
    color: 'secondary',
    description: t('home.tools.quadro_desc'),
  },
  {
    name: t('home.tools.full_team'),
    path: '/quick-pick/team',
    icon: 'i-lucide-shield',
    color: 'warning',
    description: t('home.tools.full_team_desc'),
  },
  {
    name: t('home.tools.team_ups'),
    path: '/quick-pick/teamups',
    icon: 'i-lucide-flame',
    color: 'error',
    description: t('home.tools.team_ups_desc'),
  },
  {
    name: t('home.tools.data_base'),
    path: '/data-base',
    icon: 'i-lucide-database',
    color: 'neutral',
    description: t('home.tools.data_base_desc'),
  },
] as const

const steps = [
  {
    icon: 'i-lucide-user-plus',
    title: t('home.how_it_works.steps.select.title'),
    description: t('home.how_it_works.steps.select.desc'),
  },
  {
    icon: 'i-lucide-list-filter',
    title: t('home.how_it_works.steps.roles.title'),
    description: t('home.how_it_works.steps.roles.desc'),
  },
  {
    icon: 'i-lucide-sliders-horizontal',
    title: t('home.how_it_works.steps.params.title'),
    description: t('home.how_it_works.steps.params.desc'),
  },
  {
    icon: 'i-lucide-wand-2',
    title: t('home.how_it_works.steps.generate.title'),
    description: t('home.how_it_works.steps.generate.desc'),
  },
]

const features = [
  {
    icon: 'i-lucide-brain',
    title: t('home.features.ai.title'),
    description: t('home.features.ai.desc'),
  },
  {
    icon: 'i-lucide-trending-up',
    title: t('home.features.meta.title'),
    description: t('home.features.meta.desc'),
  },
  {
    icon: 'i-lucide-sliders-horizontal',
    title: t('home.features.custom.title'),
    description: t('home.features.custom.desc'),
  },
]
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
    <!-- Hero -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 text-center">
      <div
        class="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 mb-5 bg-primary-50 dark:bg-primary-950/30 px-3 py-1 rounded-full border border-primary-100 dark:border-primary-900"
      >
        <UIcon name="i-lucide-sparkles" class="size-3.5" />
        {{ $t('home.hero.badge') }}
      </div>
      <h1
        class="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white mb-5"
      >
        {{ $t('home.hero.title') }}
      </h1>
      <p class="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10">
        {{ $t('home.hero.subtitle') }}
        <NuxtLink
          target="_blank"
          rel="noopener noreferrer"
          to="https://boosty.to/metarivals/donate"
          class="text-lg text-green-600 dark:text-green-300 mx-auto mb-20 font-semibold"
        >
          {{ $t('home.hero.boosty') }}
        </NuxtLink>
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UButton to="/quick-pick" size="lg" color="primary" trailing-icon="i-lucide-arrow-right">
          {{ $t('home.hero.start') }}
        </UButton>
        <UButton
          to="/data-base"
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-database"
        >
          {{ $t('home.hero.browse') }}
        </UButton>
      </div>
    </div>

    <!-- How it works -->
    <div class="border-t border-gray-100 dark:border-gray-900">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2
          class="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-center mb-10"
        >
          {{ $t('home.how_it_works.title') }}
        </h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="step in steps" :key="step.title" class="text-center">
            <div
              class="size-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4"
            >
              <UIcon :name="step.icon" class="size-5 text-gray-700 dark:text-gray-300" />
            </div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {{ step.title }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {{ step.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tools -->
    <div class="border-t border-gray-100 dark:border-gray-900">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-2">
          {{ $t('home.tools.title') }}
        </h2>
        <p class="text-center text-gray-500 dark:text-gray-400 mb-10 max-w-lg mx-auto">
          {{ $t('home.tools.subtitle') }}
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink v-for="tool in tools" :key="tool.name" :to="tool.path" class="group">
            <UCard
              class="h-full transition-all hover:shadow-md hover:-translate-y-0.5 dark:bg-gray-900 dark:border-gray-800"
              :ui="{ body: 'flex items-start gap-4' }"
            >
              <UIcon
                :name="tool.icon"
                class="size-5 shrink-0 mt-0.5"
                :class="`text-${tool.color === 'neutral' ? 'gray' : tool.color}-500`"
              />
              <div class="flex-1 min-w-0">
                <h3
                  class="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                >
                  {{ tool.name }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {{ tool.description }}
                </p>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4 text-gray-300 dark:text-gray-700 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
              />
            </UCard>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Features -->
    <div class="border-t border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/30">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div v-for="feature in features" :key="feature.title">
            <UIcon :name="feature.icon" class="size-6 text-primary-500 mb-3" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              {{ feature.title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="border-t border-gray-100 dark:border-gray-900">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          {{ $t('home.cta.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8">
          {{ $t('home.cta.subtitle') }}
        </p>
        <UButton to="/quick-pick" size="lg" color="primary" trailing-icon="i-lucide-arrow-right">
          {{ $t('home.cta.button') }}
        </UButton>
      </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-gray-100 dark:border-gray-900 py-8">
      <div
        class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400 dark:text-gray-600"
      >
        {{ $t('home.footer') }}
      </div>
    </footer>
  </div>
</template>
