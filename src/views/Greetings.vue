<script setup>
import { useRouter } from 'vue-router'
import { useSplashSettings } from '@/hooks'

const router = useRouter()
const { backgroundStyle } = useSplashSettings()

const goToMainPage = () => {
  router.push('/main')
}
</script>

<template>
  <main :style="backgroundStyle">
    <div class="container">
      <h1 class="greetings">Добро пожаловать!</h1>
    </div>
    <button class="start-button" @click="goToMainPage">Начать</button>
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  width: 100vw;
}

.greetings {
  font-weight: bold;
  font-size: clamp(2rem, 8vw, 5rem);
  color: #1c1c1c;
}

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  width: 95%;
  height: clamp(50px, 10vh, 100px);
  margin-bottom: 1rem;
  border-radius: 25px;
}

.start-button {
  width: clamp(200px, 80%, 706px);
  height: clamp(50px, 10vh, 108px);
  background: #d9d9d9;
  border-radius: 25px;
  border: none;
  color: #1c1c1c;
  font-size: clamp(1.5rem, 6vw, 4rem);
  font-weight: bold;
  cursor: pointer;
  padding: 0.5rem 1rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .container {
    width: 95%;
    margin-bottom: 0.5rem;
  }
  .start-button {
    margin-bottom: 1rem;
  }
}

@media (min-width: 1024px) {
  .greetings {
    font-size: 5rem;
  }
  .start-button {
    width: 706px;
    height: 108px;
    padding: 9px 216px;
    margin-bottom: 41px;
  }
}
</style>
