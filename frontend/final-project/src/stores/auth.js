import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 设置axios默认配置
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  async function login(credentials) {
    loading.value = true
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)

      token.value = response.data.token
      // 确保role字段存在
      user.value = {
        ...response.data.user,
        role: response.data.user?.role || 'user'
      }

      localStorage.setItem('token', token.value)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || '登录失败'
      }
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData)
      return { success: true, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || '注册失败'
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchUserInfo() {
    if (!token.value) return

    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`)
      user.value = response.data
      // 确保role字段存在
      if (!user.value.role) {
        user.value.role = 'user'
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      logout()
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  // 清除用户相关的数据（用于登录成功和登出时调用）
  function clearUserData() {
    // 这个函数将由其他 store 使用来清除用户相关数据
    // 通过事件系统通知其他 store 清除数据
    window.dispatchEvent(new CustomEvent('user-data-clear'))
  }

  // 刷新用户数据（登录成功后调用）
  function refreshUserData() {
    // 通过事件系统通知其他 store 刷新数据
    window.dispatchEvent(new CustomEvent('user-data-refresh'))
  }

  // 初始化时获取用户信息
  if (token.value && !user.value) {
    fetchUserInfo()
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    currentUser,
    isAdmin,
    login,
    register,
    logout,
    fetchUserInfo,
    clearUserData,
    refreshUserData
  }
})
