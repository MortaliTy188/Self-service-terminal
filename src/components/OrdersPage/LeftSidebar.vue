<template>
  <div class="container-left">
    <h1 class="title">логотип</h1>
    <div class="controls">
      <div class="controls-top">
        <button
          class="control-button"
          :class="{ active: activeTab === 'orders' }"
          @click="$emit('tab-change', 'orders')"
        >
          <span>Заказы</span>
        </button>
        <button
          class="control-button"
          :class="{ active: activeTab === 'menu' }"
          @click="$emit('tab-change', 'menu')"
        >
          <span>Меню</span>
        </button>
        <button
          class="control-button"
          :class="{ active: activeTab === 'devices' }"
          @click="$emit('tab-change', 'devices')"
        >
          <span>Устройства</span>
        </button>
        <button
          class="control-button"
          :class="{ active: activeTab === 'settings' }"
          @click="$emit('tab-change', 'settings')"
        >
          <span>Настройки</span>
        </button>
      </div>
      <div class="controls-bottom">
        <button class="control-button refresh-btn" @click="$emit('refresh')">
          <span>Обновить Страницу</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    default: 'orders',
  },
})

defineEmits(['refresh', 'tab-change'])
</script>

<style scoped>
.container-left {
  width: 354px;
  display: flex;
  flex-direction: column;
  gap: 17px;
  padding-bottom: 20px;
}

@media screen and (max-width: 1280px) {
  .container-left {
    padding-bottom: 40px;
  }
}

.title {
  font-size: 25px;
  text-transform: capitalize;
  padding: 46px 100px;
  background-color: #d9d9d9;
  border-radius: 25px;
  text-align: center;
  margin: 0;
}

.controls {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 20px 0;
  background-color: #ffdfdf;
  border-radius: 25px;
}

.controls-top {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-button {
  display: flex;
  outline: none;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: none;
  max-width: 284px;
  min-width: 250px;
  border-radius: 25px;
  padding: 23px 91px;
  font-size: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f0f0f0;
  color: #333;
}

.control-button:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

.control-button.active {
  background-color: #ff6b35;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.control-button.active:hover {
  background-color: #e55a2b;
}

.refresh-btn {
  background-color: #4caf50 !important;
  color: white !important;
}

.refresh-btn:hover {
  background-color: #45a049 !important;
}

.controls-bottom .control-button {
  background-color: #4caf50;
  color: white;
}

.controls-bottom .control-button:hover {
  background-color: #45a049;
}
</style>
