<template>
  <header class="header">
    <h1 class="header__title">{{ title }}</h1>
    <div class="header__controls">
      <div class="header__table-number">{{ tableNumber }}</div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Главная страница',
  },
  tableNumber: {
    type: String,
    default: 'Номер стола',
  },
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 33px;
  background: white;
}

.header__title {
  font-size: 26px;
  font-weight: bold;
  color: #333;
  background: white;
  padding: 16px 48px;
  border-radius: 15px;
  border: 2px solid #f0f0f0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.header__title:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.header__controls {
  display: flex;
  align-items: center;
}

.header__table-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  background: white;
  padding: 16px 24px;
  border-radius: 15px;
  border: 2px solid #f0f0f0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.header__table-number:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
</style>
