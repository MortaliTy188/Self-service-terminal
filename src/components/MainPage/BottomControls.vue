<template>
  <div v-if="false" class="main-container-left-bottom">
    <button class="button" @click="$emit('showOrderDetails')">Детали заказа</button>
  </div>
</template>

<script setup>
defineEmits(['showOrderDetails'])
</script>

<style scoped>
.main-container-left-bottom {
  flex: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  background: white;
  border-radius: 20px;
  border: 1px solid #333;
  padding: 20px;
  height: 110px;
  min-height: 110px;
}

.button {
  background: #f0f0f0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
  border-radius: 15px;
  padding: 18px 32px;
  border: 1px solid #333;
  flex: 1;
  height: 70px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  transition: left 0.6s;
}

.button:hover::before {
  left: 100%;
}

.button:hover {
  background: white;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #d0d0d0;
}
</style>
