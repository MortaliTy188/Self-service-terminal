<template>
  <div class="main-container-left-top-content">
    <FoodCard
      v-for="(item, index) in items"
      :key="index"
      :item="item"
      @show-detail="$emit('show-detail', $event)"
    />
  </div>
</template>

<script setup>
import FoodCard from './FoodCard.vue'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

defineEmits(['show-detail'])
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
</style>
