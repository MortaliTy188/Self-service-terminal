<template>
  <div class="main-container-left-top-content">
    <div v-if="isLoading" class="loading">Загрузка меню...</div>
    <div v-else-if="error" class="error">Ошибка: {{ error }}</div>
    <div v-else-if="filteredItems.length === 0" class="empty">Нет блюд в данной категории</div>
    <FoodCard
      v-else
      v-for="item in filteredItems"
      :key="item.id"
      :item="item"
      @show-detail="$emit('show-detail', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FoodCard from './FoodCard.vue'
import { useMenu } from '../hooks'

const props = defineProps({
  selectedCategory: {
    type: String,
    default: null,
  },
})

defineEmits(['show-detail'])

// Используем хук для получения меню
const { menu, isLoading, error, getMenuByCategory } = useMenu()

// Вычисляем отфильтрованные элементы на основе выбранной категории
const filteredItems = computed(() => {
  if (!props.selectedCategory) {
    // Если категория не выбрана, показываем все блюда
    return menu.value
  }
  // Фильтруем блюда по выбранной категории
  return getMenuByCategory(props.selectedCategory)
})
</script>

<style scoped>
.main-container-left-top-content {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-content: flex-start;
  gap: 15px;
  padding: 25px 20px;
  background: white;
  border-radius: 20px;
  border: 1px solid #333;
  flex-wrap: wrap;
  overflow: auto;
  max-height: 100%;
}

.loading,
.error,
.empty {
  width: 100%;
  text-align: center;
  padding: 40px 20px;
  font-size: 18px;
  color: #666;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  border-radius: 8px;
  border: 1px solid #ffcdd2;
}

.empty {
  color: #757575;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
</style>
