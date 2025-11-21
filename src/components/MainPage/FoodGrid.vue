<template>
  <div class="main-container-left-top-content">
    <div v-if="isLoading" class="loading">Загрузка меню...</div>
    <div v-else-if="error" class="error">Ошибка: {{ error }}</div>
    <div v-else-if="filteredItems.length === 0" class="empty">Нет блюд в данной категории</div>
    <TransitionGroup v-else name="food-card" tag="div" class="food-grid">
      <FoodCard
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        @show-detail="$emit('show-detail', $event)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FoodCard from './FoodCard.vue'
import { useMenuStore } from '@/stores'

const props = defineProps({
  selectedCategory: {
    type: String,
    default: null,
  },
})

defineEmits(['show-detail'])

// Используем store для получения меню
const menuStore = useMenuStore()
const menu = computed(() => menuStore.menuItems)
const isLoading = computed(() => menuStore.isLoading)
const error = computed(() => menuStore.error)

// Вычисляем отфильтрованные элементы на основе выбранной категории
const filteredItems = computed(() => {
  if (!props.selectedCategory) {
    // Показываем все блюда, включая неактивные (они будут визуально отличаться)
    return menu.value
  }
  // Фильтруем блюда по выбранной категории (все, включая неактивные)
  return menu.value.filter((item) => item.category_id === props.selectedCategory)
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

.food-grid {
  display: flex;
  justify-content: flex-start;
  align-content: flex-start;
  gap: 15px;
  flex-wrap: wrap;
  width: 100%;
}

/* Transition анимации для карточек */
.food-card-enter-active,
.food-card-leave-active {
  transition: all 0.5s ease;
}

.food-card-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.food-card-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}

.food-card-move {
  transition: transform 0.5s ease;
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
