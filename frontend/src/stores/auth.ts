import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

interface User {
  id: string
  email: string
  username: string
}

const TOKEN_KEY = 'cg_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(null)

  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password })
    token.value = response.data.access_token
    user.value = response.data.user
    localStorage.setItem(TOKEN_KEY, token.value!)
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
      delete api.defaults.headers.common['Authorization']
    }
  }

  async function checkSession() {
    if (!token.value) return
    try {
      const response = await api.get('/auth/me')
      user.value = response.data
    } catch {
      token.value = null
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  return { token, user, isAuthenticated, login, logout, checkSession }
})
