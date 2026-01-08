<template>
  <div
    class="food-card"
    :class="{ 'food-card--unavailable': !item.is_active }"
    @click="handleClick"
  >
    <div class="food-card__media">
      <div v-if="!item.is_active" class="unavailable-overlay">
        <div class="unavailable-badge">Нет в наличии</div>
      </div>

      <img
        class="food-card__image"
        :src="item.image || placeholderImage"
        :alt="item.name || item.title"
        @error="handleImageError"
      />
    </div>

    <div class="food-card__body">
      <div class="food-card__title">{{ item.name || item.title }}</div>
      <div class="food-card__weight">{{ item.weight ? `${item.weight} г` : '—' }}</div>

      <button
        class="food-card__action"
        type="button"
        :disabled="!item.is_active"
        @click.stop="handleClick"
      >
        + {{ item.price }} ₽
      </button>
    </div>
  </div>
</template>

<script setup>
import placeholderImage from '@/assets/image 28.png'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['show-detail'])

const handleImageError = (event) => {
  event.target.src = placeholderImage
}

const handleClick = () => {
  // Если блюдо неактивно, не открываем детали
  if (!props.item.is_active) {
    return
  }
  emit('show-detail', props.item)
}
</script>

<style scoped>
.food-card {
  background: transparent;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 0;
  width: 100%;
  height: 440px;
  cursor: pointer;
  /*   transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); */
  border-radius: 15px;
  flex-shrink: 0;
  align-self: flex-start;
  /*   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); */
  border: none;
  position: relative;
  overflow: hidden;
}

.food-card__media {
  position: relative;
  width: 100%;
  height: 286px;
  overflow: hidden;
}

/* Стили для недоступных блюд */
.food-card--unavailable {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(70%);
}

/* .food-card--unavailable:hover {
  transform: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: transparent;
} */

.unavailable-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.unavailable-badge {
  /*   background: #f44336; */
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  /*   box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4); */
  /*   transform: rotate(-5deg); */
}

/* .food-card:hover {
  background: transparent;
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
} */

.food-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
  margin: 0;
  box-shadow: none;
  transition: transform 0.3s ease;
}

.food-card:hover .food-card__image {
  transform: scale(1.05);
}

.food-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px;
}

.food-card__title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: #151515;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
}

.food-card__weight {
  font-size: 16px;
  line-height: 1.2;
  color: #151515;
  opacity: 0.7;
  margin-bottom: 14px;
}

.food-card__action {
  margin-top: auto;
  width: 132px;
  height: 52px;
  padding: 0;
  border: none;
  border-radius: 67px;
  background: #f5f4f2;
  color: #151515;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
}

.food-card__action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
