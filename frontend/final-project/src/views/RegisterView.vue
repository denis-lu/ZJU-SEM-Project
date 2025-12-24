<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
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
        <h2>注册账号</h2>
        <p class="subtitle">开始您的智能内容之旅</p>
        <div class="welcome-text">
          <p>创建您的账户，体验AI驱动的内容分析</p>
        </div>
      </div>
      
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        @submit.prevent="handleSubmit"
        size="large"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="form.email" 
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
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
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="form.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
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
            {{ authStore.loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>
        
        <div class="register-footer">
          <span>已有账号？</span>
          <router-link to="/login" class="login-link">立即登录</router-link>
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

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref()
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    
    const result = await authStore.register({
      username: form.username,
      email: form.email,
      password: form.password
    })
    
    if (result.success) {
      ElMessage.success('注册成功！请登录')
      router.push('/login')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('注册表单验证失败:', error)
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

/* Bento 风格注册卡片 */
.register-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 48px 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
  position: relative;
  transition: all 0.3s ease;
}

.register-card:hover {
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 12px 32px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

/* 注册头部样式 */
.register-header {
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

.register-header h2 {
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
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #1d1d1f;
  font-size: 15px;
  margin-bottom: 8px;
  white-space: nowrap;
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
.register-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  color: #86868b;
  font-size: 15px;
  font-weight: 400;
}

.login-link {
  color: #1d1d1f;
  text-decoration: none;
  margin-left: 4px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.login-link:hover {
  color: #000000;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-container {
    padding: 16px;
  }
  
  .register-card {
    padding: 32px 24px;
    border-radius: 20px;
  }
  
  .register-header h2 {
    font-size: 28px;
  }
  
  :deep(.el-button--primary) {
    height: 48px;
    font-size: 15px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
}

/* 动画入场效果 */
.register-card {
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
</style>
