<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { AdminAuthProvider } from '@/components/common'
</script>

<template>
  <main>
    <RouterView />
    <AdminAuthProvider />
  </main>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  overflow-y: hidden;
}
</style>
