import type { RoleType } from '~/types/sheets'

type RoleFilter = 'all' | RoleType

export function useRoleFilter<T>(
  items: Ref<T[]>,
  selectedRoles: Ref<RoleFilter>[],
  getRoles: (item: T) => (RoleType | null)[]
) {
  const hasActiveFilters = computed(() => {
    return selectedRoles.some((ref) => ref.value !== 'all')
  })

  const resetFilters = () => {
    selectedRoles.forEach((ref) => {
      ref.value = 'all'
    })
  }

  const filteredItems = computed(() => {
    // Собираем все активные фильтры (игнорируем 'all')
    const activeFilters = selectedRoles
      .map((ref) => ref.value)
      .filter((r): r is RoleType => r !== 'all')

    // Если фильтров нет, возвращаем всё
    if (activeFilters.length === 0) {
      return items.value
    }

    return items.value.filter((item) => {
      // Получаем реальные роли элемента, отбрасывая null
      const itemRoles = getRoles(item).filter((r): r is RoleType => r !== null)

      // Проверяем, что все запрошенные фильтры присутствуют в ролях элемента.
      // Копируем массив, чтобы безопасно удалять совпадения (это корректно обрабатывает дубликаты, например, 2 танка)
      const availableRoles = [...itemRoles]

      for (const filterRole of activeFilters) {
        const index = availableRoles.indexOf(filterRole)
        if (index === -1) {
          return false // Требуемая роль не найдена
        }
        // Удаляем найденную роль, чтобы следующий такой же фильтр искал другого героя с этой ролью
        availableRoles.splice(index, 1)
      }

      return true
    })
  })

  return {
    filteredItems,
    hasActiveFilters,
    resetFilters,
  }
}
