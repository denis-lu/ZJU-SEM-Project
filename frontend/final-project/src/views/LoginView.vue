<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#gradient)" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="url(#gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="url(#gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#86868b" />
                  <stop offset="100%" style="stop-color:#1d1d1f" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <h2>SmartDigest</h2>
        <p class="subtitle">智能内容摘要与洞察助手</p>
        <div class="welcome-text">
          <p>欢迎回来！请登录您的账户</p>
        </div>
      </div>
      
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        @submit.prevent="handleSubmit"
        size="large"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名或邮箱"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="authStore.loading"
            @click="handleSubmit"
            style="width: 100%"
          >
            {{ authStore.loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
        
        <div class="login-footer">
          <span>还没有账号？</span>
          <router-link to="/register" class="register-link">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useArticlesStore } from '../stores/articles'

const router = useRouter()
const authStore = useAuthStore()
const articlesStore = useArticlesStore()

const formRef = ref()
const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    
    const result = await authStore.login({
      username: form.username,
      password: form.password
    })
    
    if (result.success) {
      // 清除上一个用户的数据
      authStore.clearUserData()
      
      // 等待一小段时间确保数据清除完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 刷新新用户的数据
      authStore.refreshUserData()
      
      ElMessage.success('登录成功！')
      
      // 根据用户角色跳转
      if (authStore.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('登录表单验证失败:', error)
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

/* Bento 风格登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 48px 40px;
  width: 100%;
  max-width: 440px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
  position: relative;
  transition: all 0.3s ease;
}

.login-card:hover {
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 12px 32px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

/* 登录头部样式 */
.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.logo-icon {
  padding: 16px;
  background: rgba(142, 142, 147, 0.1);
  border-radius: 20px;
  border: 0.5px solid rgba(142, 142, 147, 0.2);
  transition: all 0.3s ease;
}

.logo-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(142, 142, 147, 0.15);
}

.logo-icon svg {
  filter: drop-shadow(0 2px 4px rgba(142, 142, 147, 0.2));
}

.login-header h2 {
  margin: 16px 0 8px 0;
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1d1d1f;
}

.subtitle {
  color: #86868b;
  font-size: 17px;
  font-weight: 400;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.welcome-text {
  margin-top: 20px;
  padding: 16px;
  background: rgba(142, 142, 147, 0.05);
  border-radius: 16px;
  border: 0.5px solid rgba(142, 142, 147, 0.1);
}

.welcome-text p {
  color: #1d1d1f;
  font-size: 15px;
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
}

/* 表单样式优化 */
:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #1d1d1f;
  font-size: 15px;
  margin-bottom: 8px;
}

:deep(.el-input__wrapper) {
  padding: 14px 18px;
  border-radius: 18px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(142, 142, 147, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #86868b;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(142, 142, 147, 0.1);
}

:deep(.el-input__inner) {
  font-size: 15px;
  font-weight: 400;
  color: #1d1d1f;
}

:deep(.el-input__inner::placeholder) {
  color: #86868b;
  font-weight: 400;
}

:deep(.el-button--primary) {
  width: 100% !important;
  height: 52px !important;
  font-size: 17px !important;
  font-weight: 600 !important;
  border-radius: 18px !important;
  background: #007AFF !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3) !important;
  transition: all 0.2s ease !important;
}

:deep(.el-button--primary:hover) {
  background: #0051D5 !important;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4) !important;
  transform: translateY(-1px) !important;
}

:deep(.el-button--primary:active) {
  transform: translateY(0) !important;
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.3) !important;
}

/* 页脚样式 */
.login-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  color: #86868b;
  font-size: 15px;
  font-weight: 400;
}

.register-link {
  color: #1d1d1f;
  text-decoration: none;
  margin-left: 4px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.register-link:hover {
  color: #000000;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-card {
    padding: 32px 24px;
    border-radius: 20px;
  }
  
  .login-header h2 {
    font-size: 28px;
  }
  
  :deep(.el-button--primary) {
    height: 48px;
    font-size: 15px;
  }
}

/* 动画入场效果 */
.login-card {
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 载入动画 */
:deep(.el-button.is-loading) {
  pointer-events: none;
}

:deep(.el-loading-spinner) {
  margin-top: -10px;
}
</style>
