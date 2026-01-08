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

const PROMO_FILTER = '__PROMO__'

const isPromoItem = (item) => {
  if (!item || typeof item !== 'object') return false

  // Булевы флаги (если бэкенд их предоставляет)
  if (item.is_promo === true) return true
  if (item.isPromo === true) return true
  if (item.is_promotion === true) return true
  if (item.isPromotion === true) return true
  if (item.promo === true) return true
  if (item.on_sale === true) return true
  if (item.is_sale === true) return true

  // Скидка/процент
  const discountPercent = Number(item.discount_percent ?? item.discountPercent ?? item.sale_percent)
  if (Number.isFinite(discountPercent) && discountPercent > 0) return true

  // Сравнение старой/новой цены
  const price = Number(item.price)
  const oldPrice = Number(
    item.old_price ?? item.oldPrice ?? item.price_old ?? item.priceOld ?? item.previous_price,
  )
  if (Number.isFinite(price) && Number.isFinite(oldPrice) && oldPrice > price) return true

  return false
}

// Вычисляем отфильтрованные элементы на основе выбранной категории
const filteredItems = computed(() => {
  if (!props.selectedCategory) {
    // Показываем все блюда, включая неактивные (они будут визуально отличаться)
    return menu.value
  }

  if (props.selectedCategory === PROMO_FILTER) {
    return menu.value.filter(isPromoItem)
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
  padding: 16px;
  background: transparent;
  flex-wrap: wrap;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 100%;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  justify-content: start;
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
  border: none;
}

.empty {
  color: #757575;
  background: #f5f5f5;
  border-radius: 8px;
  border: none;
}
</style>
