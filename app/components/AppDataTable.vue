<template>
  <div
    class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-900"
  >
    <table class="w-full text-sm text-left text-gray-700 dark:text-gray-300">
      <thead
        class="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold uppercase tracking-wider text-xs"
      >
        <tr>
          <th
            v-for="key in columns"
            :key="key"
            class="p-3 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
          >
            {{ formatColumnName(key) }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
        <tr
          v-for="(row, rowIndex) in data"
          :key="rowIndex"
          class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
        >
          <td v-for="key in columns" :key="key" class="p-3 whitespace-nowrap">
            {{ row[key] ?? "—" }}
          </td>
        </tr>
        <tr v-if="data.length === 0">
          <td
            :colspan="columns.length"
            class="p-6 text-center text-gray-500 dark:text-gray-400"
          >
            Нет данных для отображения
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: Record<string, any>[];
}>();

const columns = computed(() => {
  if (props.data.length > 0) {
    return Object.keys(props.data[0]);
  }
  return [];
});

const formatColumnName = (key: string) => {
  // Превращаем camelCase или snake_case в читаемый вид (например, "heroName" -> "Hero Name")
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase());
};
</script>
