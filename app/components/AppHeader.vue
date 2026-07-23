<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Логотип / Бренд -->
      <NuxtLink to="/" class="flex items-center gap-2.5 group">
        <div
          class="size-9 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center transition-colors group-hover:bg-primary-500/20 dark:group-hover:bg-primary-500/30"
        >
          <UIcon name="i-lucide-shield" class="size-5 text-primary-600 dark:text-primary-400" />
        </div>
        <span
          class="font-bold text-lg text-gray-900 dark:text-white tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
        >
          MetaRivals
        </span>
      </NuxtLink>

      <div class="flex justify-center items-center">
        <ThemeToggle class="mr-2" />
        <!-- <PaymentButton :price="5" description="Donate" /> -->
        <LanguageSwitcher />
      </div>
    </div>
  </header>
</template>

<script></script>
