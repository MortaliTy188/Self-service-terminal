import { computed } from 'vue'
import { useCategories } from './useCategories.js'
import { useMenu } from './useMenu.js'

export function useMenuWithCategories() {
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const { menu, isLoading: menuLoading, error: menuError, getMenuByCategory } = useMenu()

  // Общее состояние загрузки
  const isLoading = computed(() => categoriesLoading.value || menuLoading.value)

  // Общая ошибка
  const error = computed(() => categoriesError.value || menuError.value)

  // Получить название категории по ID
  const getCategoryName = (categoryId) => {
    const category = categories.value.find((cat) => cat.id === categoryId)
    return category ? category.name : 'Неизвестная категория'
  }

  // Получить меню с названиями категорий
  const enrichedMenu = computed(() => {
    return menu.value.map((item) => ({
      ...item,
      categoryName: getCategoryName(item.category_id),
    }))
  })

  // Получить статистику по категориям
  const categoriesStats = computed(() => {
    return categories.value.map((category) => {
      const itemsInCategory = getMenuByCategory(category.id)
      return {
        ...category,
        itemCount: itemsInCategory.length,
        items: itemsInCategory,
      }
    })
  })

  return {
    categories,
    menu,
    enrichedMenu,
    categoriesStats,
    isLoading,
    error,
    getCategoryName,
    getMenuByCategory,
  }
}
