<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const login = ref('')
const password = ref('')
const isSubmitting = ref(false)

const canSubmit = computed(() => login.value.trim().length > 0 && password.value.length > 0)

async function onSubmit() {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    // TODO: подключить реальную авторизацию.
    await new Promise((resolve) => setTimeout(resolve, 150))
    await router.push({ name: 'Home' })
  } finally {
    isSubmitting.value = false
  }
}

function onContactAdminClick() {
  // TODO: заменить на реальный сценарий (открыть модалку/чат/страницу помощи).
}
</script>

<template>
  <div class="container">
    <div class="inner">
      <img src="../assets/logo.png" alt="Логотип" />
      <h1>Добро пожаловать <br />в систему!</h1>

      <form @submit.prevent="onSubmit" style="width: 100%">
        <input
          v-model.trim="login"
          type="text"
          placeholder="Логин"
          autocomplete="username"
          aria-label="Логин"
          required
        />
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          autocomplete="current-password"
          aria-label="Пароль"
          required
        />
        <button type="submit" :disabled="!canSubmit || isSubmitting" :aria-busy="isSubmitting">
          {{ isSubmitting ? 'Вход…' : 'Войти в личный аккаунт' }}
        </button>
      </form>

      <a href="#" @click.prevent="onContactAdminClick">Обратиться к администратору</a>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(120deg, #cf0101 17%, #fdafaf 48%, #de3a3a 100%);
}

.inner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 550px;
}

h1 {
  color: white;
  font-size: 55px;
  margin-top: 25px;
  margin-bottom: 40px;
  line-height: 110%;
  text-align: center;
}

input {
  width: 100%;
  height: 65px;
  border-radius: 15px;
  border: none;
  margin-bottom: 15px;
  padding: 0 15px;
  font-size: 21px;
}

button {
  width: 100%;
  height: 65px;
  border-radius: 119px;
  font-size: 21px;
  border: none;
  color: white;
  margin-top: 25px;
  background-color: #151515;
  cursor: pointer;
}

a {
  margin-top: 20px;
  color: white;
  font-size: 18px;
  text-decoration: underline;
  cursor: pointer;
}
</style>
