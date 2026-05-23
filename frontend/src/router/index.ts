import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      redirect: '/sessions'
    },
    {
      path: '/sessions',
      name: 'sessions',
      component: () => import('@/views/SessionsView.vue')
    },
    {
      path: '/sessions/new',
      name: 'new-session',
      component: () => import('@/views/NewSessionView.vue')
    },
    {
      path: '/sessions/:id',
      name: 'session-detail',
      component: () => import('@/views/SessionDetailView.vue')
    },
    {
      path: '/sessions/:id/review',
      name: 'session-review',
      component: () => import('@/views/ReviewView.vue')
    }
  ]
})

let sessionChecked = false

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (!sessionChecked) {
    await authStore.checkSession()
    sessionChecked = true
  }
  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
})

export default router
