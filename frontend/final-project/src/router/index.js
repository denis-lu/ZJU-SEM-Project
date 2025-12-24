import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'Reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports/:id',
      name: 'ReportDetail',
      component: () => import('../views/ReportDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/webpages',
      name: 'WebPages',
      component: () => import('../views/ArticlesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/webpages/:id',
      name: 'WebPageDetail',
      component: () => import('../views/ArticleDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/add-webpage',
      name: 'AddWebPage',
      component: () => import('../views/AddArticleView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/add-report',
      name: 'AddReport',
      component: () => import('../views/AddArticleView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/create-report',
      name: 'CreateReport',
      component: () => import('../views/AddArticleView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 如果需要认证但未登录，跳转到登录页
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // 如果已登录但访问登录页，跳转到首页
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  // 如果需要管理员权限
  if (to.meta.requiresAdmin) {
    // 如果用户信息未加载，先加载
    if (!authStore.currentUser) {
      await authStore.fetchUserInfo()
    }

    // 检查是否为管理员
    if (!authStore.isAdmin) {
      // 非管理员用户，跳转到首页并提示
      next('/dashboard')
      // 使用 nextTick 确保路由跳转后再显示消息
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.error('权限不足，需要管理员权限')
      })
      return
    }
  }

  next()
})

export default router
