<template>
  <div class="food-card" @click="$emit('show-detail', item)">
    <img
      :src="item.image || placeholderImage"
      :alt="item.name || item.title"
      @error="handleImageError"
    />
    <p class="food-card__title">{{ item.name || item.title }}</p>
    <p class="food-card__price">Цена: {{ item.price }}₽</p>
  </div>
</template>

<script setup>
import placeholderImage from '@/assets/image 28.png'

defineProps({
  item: {
    type: Object,
    required: true,
  },
})

defineEmits(['show-detail'])

const handleImageError = (event) => {
  event.target.src = placeholderImage
}
</script>

<style scoped>
.food-card {
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 20px 15px;
  height: 220px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 15px;
  width: calc(28% - 11.25px);
  min-width: 150px;
  flex-shrink: 0;
  align-self: flex-start;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid #f0f0f0;
  position: relative;
  overflow: hidden;
}

@media screen and (max-width: 1280px) {
  .food-card {
    width: calc(42% - 10px);
  }
}

.food-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #4caf50;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.food-card:hover::before {
  transform: scaleX(1);
}

.food-card:hover {
  background: #f8f9fa;
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: #e0e0e0;
}

.food-card img {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.food-card:hover img {
  transform: scale(1.05);
}

.food-card__title {
  font-size: 15px;
  font-weight: 600;
  margin: 8px 0;
  text-align: center;
  line-height: 1.3;
  flex-grow: 1;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.food-card__price {
  font-size: 17px;
  color: #4caf50;
  text-align: center;
  margin-top: auto;
  padding-top: 12px;
  font-weight: bold;
}

@media (max-width: 1024px) {
  .food-card {
    width: calc(33.33% - 10px);
  }
}

@media (max-width: 768px) {
  .food-card {
    width: calc(50% - 7.5px);
    height: 200px;
  }
}

@media (max-width: 480px) {
  .food-card {
    width: 100%;
    height: 180px;
  }
}
</style>
