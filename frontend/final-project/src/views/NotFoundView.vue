<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-illustration">
        <el-icon size="120" color="#dcdfe6"><Warning /></el-icon>
      </div>
      
      <div class="error-text">
        <h1>404</h1>
        <h2>页面未找到</h2>
        <p>抱歉，您访问的页面不存在或已被移除。</p>
      </div>
      
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome" icon="House">
          返回首页
        </el-button>
        <el-button size="large" @click="goBack" icon="ArrowLeft">
          返回上页
        </el-button>
      </div>
      
      <div class="quick-links">
        <h3>快速导航</h3>
        <div class="links-grid">
          <router-link to="/dashboard" class="quick-link">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据面板</span>
          </router-link>
          
          <router-link to="/articles" class="quick-link">
            <el-icon><Document /></el-icon>
            <span>文章列表</span>
          </router-link>
          
          <router-link to="/add-article" class="quick-link">
            <el-icon><Plus /></el-icon>
            <span>添加文章</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}

function goBack() {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  background: #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.not-found-content {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 48px;
  text-align: center;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
  max-width: 500px;
  width: 100%;
}

.error-illustration {
  margin-bottom: 30px;
}

.error-text h1 {
  font-size: 80px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #86868b;
  margin: 0;
  line-height: 1;
}

.error-text h2 {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1d1d1f;
  margin: 16px 0 8px 0;
}

.error-text p {
  color: #86868b;
  font-size: 17px;
  font-weight: 400;
  margin: 0 0 30px 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.quick-links h3 {
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px 0;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border-radius: 18px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: #86868b;
  transition: all 0.3s ease;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.03);
}

.quick-link:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.15);
  color: #1d1d1f;
  transform: translateY(-2px);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.05);
}

.quick-link span {
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 480px) {
  .not-found-content {
    padding: 30px 20px;
  }
  
  .error-text h1 {
    font-size: 56px;
  }
  
  .error-text h2 {
    font-size: 20px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .links-grid {
    grid-template-columns: 1fr;
  }
}

:deep(.el-button--primary) {
  background: #007AFF !important;
  border: none !important;
  color: white !important;
  border-radius: 18px !important;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3) !important;
}

:deep(.el-button--primary:hover) {
  background: #0051D5 !important;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4) !important;
}
</style>
