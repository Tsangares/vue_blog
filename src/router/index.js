import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import EditorPage from '../views/EditorPage.vue'
import { supabaseService } from '../services/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/editor',
      name: 'editor',
      component: EditorPage,
      meta: { requiresAuth: true }
    }
  ]
})

// Route guard for protected routes
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const { data } = await supabaseService.getCurrentUser()
    if (!data.user) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router