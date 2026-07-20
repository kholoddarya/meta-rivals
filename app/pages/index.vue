<script setup lang="ts">
const tools = [
  {
    name: 'Quick Pick',
    path: '/quick-pick',
    icon: 'i-lucide-zap',
    color: 'primary',
    description:
      'Fast team builder with smart recommendations based on synergies, tiers, and counter-picks.',
    features: ['Role-based drafting', 'AI recommendations', 'Real-time validation'],
  },
  {
    name: 'Duo (2v2)',
    path: '/quick-pick/duo',
    icon: 'i-lucide-users',
    color: 'blue',
    description: 'Build powerful duos focusing on hero bonds and synergies between pairs.',
    features: ['2-hero compositions', 'Pair synergies', 'Quick matches'],
  },
  {
    name: 'Trio (3v3)',
    path: '/quick-pick/trio',
    icon: 'i-lucide-users-round',
    color: 'green',
    description: 'Balanced 3-hero teams with optimal role distribution and team bonuses.',
    features: ['3-hero compositions', 'Role balance', 'Team bonuses'],
  },
  {
    name: 'Quadro (4v4)',
    path: '/quick-pick/quadro',
    icon: 'i-lucide-user-plus',
    color: 'purple',
    description: 'Expanded 4-player parties with advanced role selection and counter-picks.',
    features: ['4-hero compositions', 'Counter-picks', 'Tactical depth'],
  },
  {
    name: 'Full Team (6v6)',
    path: '/quick-pick/team',
    icon: 'i-lucide-shield',
    color: 'orange',
    description: 'Complete 6-hero lineups based on player preferences, tiers, and classes.',
    features: ['Full team composition', 'Tier optimization', 'Class balance'],
  },
  {
    name: 'Team-Ups',
    path: '/quick-pick/teamups',
    icon: 'i-lucide-flame',
    color: 'red',
    description:
      'Theoretically strongest team compositions based on current meta and hero strength.',
    features: ['Meta builds', 'Top-tier combos', 'Competitive edge'],
  },
  {
    name: 'Data Base',
    path: '/data-base',
    icon: 'i-lucide-database',
    color: 'gray',
    description: 'Browse all heroes, their roles, classes, tiers, and detailed statistics.',
    features: ['Hero database', 'Statistics', 'Detailed info'],
  },
]

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
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900"
  >
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/5 dark:to-purple-500/5"
      />

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6"
        >
          <UIcon name="i-lucide-sparkles" class="size-4" />
          Marvel Rivals Team Builder
        </div>

        <h1 class="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Build Your Perfect Team
          <span
            class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600"
          >
            Team
          </span>
        </h1>

        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
          AI-powered team composition tool for Marvel Rivals. Generate optimal lineups based on
          synergies, tiers, counter-picks, and meta strategies.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            to="/quick-pick"
            size="xl"
            color="primary"
            icon="i-lucide-rocket"
            trailing-icon="i-lucide-arrow-right"
          >
            Start Building
          </UButton>
          <UButton
            to="/data-base"
            size="xl"
            color="neutral"
            variant="ghost"
            icon="i-lucide-database"
          >
            Browse Heroes
          </UButton>
        </div>
      </div>
    </div>

    <!-- How It Works -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
        How It Works
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="(step, index) in steps" :key="index" class="relative">
          <div class="flex flex-col items-center text-center">
            <div
              class="size-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4"
            >
              <UIcon :name="step.icon" class="size-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {{ step.title }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ step.description }}
            </p>
          </div>

          <!-- Connector line -->
          <div
            v-if="index < steps.length - 1"
            class="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-300 to-primary-100 dark:from-primary-700 dark:to-primary-900/30"
          />
        </div>
      </div>
    </div>

    <!-- Tools Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
        Team Building Tools
      </h2>
      <p class="text-center text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
        Choose the perfect tool for your team size and strategy. Each mode is optimized for specific
        gameplay scenarios.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink v-for="tool in tools" :key="tool.name" :to="tool.path" class="group">
          <UCard
            class="h-full hover:ring-2 hover:ring-primary-500/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            :class="[
              tool.color === 'primary' && 'border-primary-200 dark:border-primary-800',
              tool.color === 'blue' && 'border-blue-200 dark:border-blue-800',
              tool.color === 'green' && 'border-green-200 dark:border-green-800',
              tool.color === 'purple' && 'border-purple-200 dark:border-purple-800',
              tool.color === 'orange' && 'border-orange-200 dark:border-orange-800',
              tool.color === 'red' && 'border-red-200 dark:border-red-800',
              tool.color === 'gray' && 'border-gray-200 dark:border-gray-800',
            ]"
          >
            <div class="flex items-start gap-4">
              <div
                class="size-12 rounded-xl flex items-center justify-center shrink-0"
                :class="[
                  tool.color === 'primary' && 'bg-primary-100 dark:bg-primary-900/40',
                  tool.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/40',
                  tool.color === 'green' && 'bg-green-100 dark:bg-green-900/40',
                  tool.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/40',
                  tool.color === 'orange' && 'bg-orange-100 dark:bg-orange-900/40',
                  tool.color === 'red' && 'bg-red-100 dark:bg-red-900/40',
                  tool.color === 'gray' && 'bg-gray-100 dark:bg-gray-900/40',
                ]"
              >
                <UIcon
                  :name="tool.icon"
                  class="size-6"
                  :class="[
                    tool.color === 'primary' && 'text-primary-600 dark:text-primary-400',
                    tool.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                    tool.color === 'green' && 'text-green-600 dark:text-green-400',
                    tool.color === 'purple' && 'text-purple-600 dark:text-purple-400',
                    tool.color === 'orange' && 'text-orange-600 dark:text-orange-400',
                    tool.color === 'red' && 'text-red-600 dark:text-red-400',
                    tool.color === 'gray' && 'text-gray-600 dark:text-gray-400',
                  ]"
                />
              </div>

              <div class="flex-1">
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                >
                  {{ tool.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {{ tool.description }}
                </p>

                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="feature in tool.features"
                    :key="feature"
                    size="xs"
                    variant="subtle"
                    :color="tool.color"
                  >
                    {{ feature }}
                  </UBadge>
                </div>
              </div>

              <UIcon
                name="i-lucide-arrow-right"
                class="size-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all"
              />
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>

    <!-- Features -->
    <div class="bg-gray-50 dark:bg-gray-900/50 py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Why Use MetaRivals?
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div
              class="size-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto mb-4"
            >
              <UIcon name="i-lucide-brain" class="size-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Smart algorithms analyze thousands of combinations to find the best team for your
              needs.
            </p>
          </div>

          <div class="text-center">
            <div
              class="size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto mb-4"
            >
              <UIcon name="i-lucide-trending-up" class="size-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Meta-Aware</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Stay competitive with up-to-date tier lists, hero strengths, and current meta
              strategies.
            </p>
          </div>

          <div class="text-center">
            <div
              class="size-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4"
            >
              <UIcon name="i-lucide-palette" class="size-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Fully Customizable
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Fine-tune every aspect: synergies, counter-picks, class weights, and role
              distributions.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div
        class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-700 dark:to-purple-700 p-12 text-center"
      >
        <div
          class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"
        />

        <div class="relative">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Build Your Dream Team?
          </h2>
          <p class="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of players who use MetaRivals to dominate in Marvel Rivals.
          </p>
          <UButton
            to="/quick-pick"
            size="xl"
            color="white"
            icon="i-lucide-rocket"
            trailing-icon="i-lucide-arrow-right"
          >
            Get Started Now
          </UButton>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-8">
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400"
      >
        <p>MetaRivals - Marvel Rivals Team Builder</p>
        <p class="mt-2">Built with ❤️ for the Marvel Rivals community</p>
      </div>
    </footer>
  </div>
</template>
