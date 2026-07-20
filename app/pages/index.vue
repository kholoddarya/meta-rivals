<script setup lang="ts">
const tools = [
  {
    name: 'Quick Pick',
    path: '/quick-pick',
    icon: 'i-lucide-zap',
    color: 'primary',
    description:
      'Fast team builder with smart recommendations based on synergies, tiers, and counter-picks.',
  },
  {
    name: 'Duo (2v2)',
    path: '/quick-pick/duo',
    icon: 'i-lucide-users',
    color: 'info',
    description: 'Build powerful duos focusing on hero bonds and synergies between pairs.',
  },
  {
    name: 'Trio (3v3)',
    path: '/quick-pick/trio',
    icon: 'i-lucide-users-round',
    color: 'success',
    description: 'Balanced 3-hero teams with optimal role distribution and team bonuses.',
  },
  {
    name: 'Quadro (4v4)',
    path: '/quick-pick/quadro',
    icon: 'i-lucide-user-plus',
    color: 'secondary',
    description: 'Expanded 4-player parties with advanced role selection and counter-picks.',
  },
  {
    name: 'Full Team (6v6)',
    path: '/quick-pick/team',
    icon: 'i-lucide-shield',
    color: 'warning',
    description: 'Complete 6-hero lineups based on player preferences, tiers, and classes.',
  },
  {
    name: 'Team-Ups',
    path: '/quick-pick/teamups',
    icon: 'i-lucide-flame',
    color: 'error',
    description:
      'Theoretically strongest team compositions based on current meta and hero strength.',
  },
  {
    name: 'Data Base',
    path: '/data-base',
    icon: 'i-lucide-database',
    color: 'neutral',
    description: 'Browse all heroes, their roles, classes, tiers, and detailed statistics.',
  },
] as const

const steps = [
  {
    icon: 'i-lucide-user-plus',
    title: 'Select Your Heroes',
    description: "Mark heroes you want to play with and enemies you're facing.",
  },
  {
    icon: 'i-lucide-list-filter',
    title: 'Choose Roles',
    description: 'Specify how many Supports, Damage, and Tanks you need.',
  },
  {
    icon: 'i-lucide-sliders-horizontal',
    title: 'Set Parameters',
    description: 'Enable synergies, tiers, counter-picks, and class weights.',
  },
  {
    icon: 'i-lucide-wand-2',
    title: 'Generate Team',
    description: 'Get AI-powered recommendations with detailed scoring.',
  },
]

const features = [
  {
    icon: 'i-lucide-brain',
    title: 'AI-Powered',
    description:
      'Smart algorithms analyze thousands of combinations to find the best team for your needs.',
  },
  {
    icon: 'i-lucide-trending-up',
    title: 'Meta-Aware',
    description:
      'Stay competitive with up-to-date tier lists, hero strengths, and current meta strategies.',
  },
  {
    icon: 'i-lucide-sliders-horizontal',
    title: 'Fully Customizable',
    description:
      'Fine-tune every aspect: synergies, counter-picks, class weights, and role distributions.',
  },
]
</script>

<template>
  <div class="bg-white dark:bg-gray-950">
    <!-- Hero -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
      <div
        class="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 mb-5"
      >
        <UIcon name="i-lucide-sparkles" class="size-3.5" />
        Marvel Rivals Team Builder
      </div>

      <h1
        class="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white mb-5"
      >
        Build your perfect team
      </h1>

      <p class="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10">
        Generate optimal Marvel Rivals lineups based on synergies, tiers, counter-picks and the
        current meta.
      </p>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UButton to="/quick-pick" size="lg" color="primary" trailing-icon="i-lucide-arrow-right">
          Start building
        </UButton>
        <UButton
          to="/data-base"
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-database"
        >
          Browse heroes
        </UButton>
      </div>
    </div>

    <!-- How it works -->
    <div class="border-t border-gray-100 dark:border-gray-900">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2
          class="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-center mb-10"
        >
          How it works
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
          Team building tools
        </h2>
        <p class="text-center text-gray-500 dark:text-gray-400 mb-10 max-w-lg mx-auto">
          Pick the mode that fits your party size.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink v-for="tool in tools" :key="tool.name" :to="tool.path" class="group">
            <UCard
              class="h-full transition-all hover:shadow-md hover:-translate-y-0.5"
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
          Ready to build your dream team?
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8">
          Free, fast, and updated with the current meta.
        </p>
        <UButton to="/quick-pick" size="lg" color="primary" trailing-icon="i-lucide-arrow-right">
          Get started
        </UButton>
      </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-gray-100 dark:border-gray-900 py-8">
      <div
        class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400 dark:text-gray-600"
      >
        MetaRivals · Marvel Rivals Team Builder
      </div>
    </footer>
  </div>
</template>
