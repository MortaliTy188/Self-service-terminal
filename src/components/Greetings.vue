<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToMainPage = () => {
  router.push('/main')
}
</script>

<template>
  <main>
    <div class="container">
      <h1 class="greetings">Добро пожаловать!</h1>
    </div>
    <button class="start-button" @click="goToMainPage">Начать</button>
  </main>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
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
  background-image: url("@/assets/mainBackground.png");
  background-repeat: no-repeat;
  background-size: cover;
  height: 100vh;
}

.greetings {
  font-weight: bold;
  font-size: 75px;
  color: #1C1C1C;
}

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  width: 100%;
  height: 100px;
  margin-bottom: 14px;
  border-radius: 25px;
}

.start-button {
  width: 706px;
  height: 108px;
  background: #D9D9D9;
  border-radius: 25px;
  border: none;
  color: #1C1C1C;
  font-size: 75px;
  font-weight: bold;
  cursor: pointer;
  padding: 9px 216px;
  margin-bottom: 41px;
}
</style>
