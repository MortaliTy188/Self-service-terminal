<template>
  <AdminAuthModal
    :show="showAuthModal"
    :error="authError"
    :is-loading="isAuthenticating"
    @close="closeAuthModal"
    @submit="handleAdminKeySubmit"
  />
</template>

<script setup>
import { AdminAuthModal } from '@/components/common'
import { useAdminAuth } from '@/hooks'

// Используем композабл для управления аутентификацией
const { showAuthModal, authError, isAuthenticating, handleAdminKeySubmit, closeAuthModal } =
  useAdminAuth()
</script>
