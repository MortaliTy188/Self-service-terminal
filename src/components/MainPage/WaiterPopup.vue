<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const closePopup = () => {
  emit('close')
}
</script>

<template>
  <div v-if="show" class="popup-overlay" @click="closePopup">
    <div class="popup-container" @click.stop>
      <div class="popup-content">
        <div v-if="isLoading" class="loading-content">
          <div class="spinner"></div>
          <h2>Вызываем официанта...</h2>
          <p>Пожалуйста, подождите</p>
        </div>
        <div v-else class="success-content">
          <h2>Официант скоро подойдет.</h2>
          <p>Пожалуйста, ожидайте.</p>
          <button class="close-button" @click="closePopup">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
}

.popup-container {
  background-color: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  cursor: default;
}

.popup-content {
  text-align: center;
}

.popup-content h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 15px;
  font-weight: bold;
}

.popup-content p {
  color: #666;
  font-size: 18px;
  margin-bottom: 25px;
  line-height: 1.5;
}

.close-button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.close-button:hover {
  background-color: #45a049;
}

.loading-content,
.success-content {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .popup-container {
    padding: 20px;
    margin: 20px;
  }

  .popup-content h2 {
    font-size: 20px;
  }

  .popup-content p {
    font-size: 16px;
  }
}
</style>
