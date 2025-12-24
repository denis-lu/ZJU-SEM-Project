<template>
  <div class="dashboard-container">
    <!-- 顶部导航 -->
    <header class="dashboard-header glass-effect">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#headerGradient)" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="url(#headerGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="url(#headerGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#86868b" />
                  <stop offset="100%" style="stop-color:#1d1d1f" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2>SmartDigest</h2>
        </div>
        <div class="header-actions">
          <div class="user-greeting">
            <div class="avatar">
              <span>{{ authStore.currentUser?.username?.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="user-info">
              <span class="welcome-text">欢迎回来</span>
              <span class="username">{{ authStore.currentUser?.username }}</span>
            </div>
          </div>
          <el-button 
            v-if="authStore.isAdmin" 
            type="info" 
            icon="Setting" 
            @click="$router.push('/admin')" 
            class="admin-button"
          >
            管理员面板
          </el-button>
          <el-button type="primary" icon="Plus" @click="$router.push('/add-webpage')" class="add-button">
            新建报告
          </el-button>
          <el-button @click="handleLogout" icon="SwitchButton" class="logout-button">退出</el-button>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="dashboard-main">
      <!-- 欢迎横幅 -->
      <div class="welcome-banner">
        <div class="banner-content">
          <div class="banner-text">
            <h1>产业报告智能生成</h1>
            <p>使用AI技术自动生成专业的产业研究报告，多轮对话式需求澄清，让研究员专注于决策洞察</p>
          </div>
          <div class="banner-illustration">
            <div class="floating-elements">
              <div class="element element-1"></div>
              <div class="element element-2"></div>
              <div class="element element-3"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="stats-section">
        <div class="section-title">
          <h2>数据概览</h2>
        </div>
        <div class="stats-cards">
          <div class="stat-card hover-lift" data-type="total">
            <div class="stat-background">
              <div class="stat-pattern"></div>
            </div>
            <div class="stat-icon">
              <div class="icon-wrapper gradient-blue">
                <el-icon size="28"><Document /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <h3 class="stat-number">{{ stats.totalReports }}</h3>
              <p class="stat-label">总报告数</p>
            </div>
          </div>
          
          <div class="stat-card hover-lift" data-type="completed">
            <div class="stat-background">
              <div class="stat-pattern"></div>
            </div>
            <div class="stat-icon">
              <div class="icon-wrapper gradient-green">
                <el-icon size="28"><Check /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <h3 class="stat-number">{{ stats.completedReports }}</h3>
              <p class="stat-label">已完成</p>
            </div>
          </div>
          
          <div class="stat-card hover-lift" data-type="processing">
            <div class="stat-background">
              <div class="stat-pattern"></div>
            </div>
            <div class="stat-icon">
              <div class="icon-wrapper gradient-orange">
                <el-icon size="28"><Loading /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <h3 class="stat-number">{{ stats.processingReports }}</h3>
              <p class="stat-label">生成中</p>
            </div>
          </div>
          
          <div class="stat-card hover-lift" data-type="conversations">
            <div class="stat-background">
              <div class="stat-pattern"></div>
            </div>
            <div class="stat-icon">
              <div class="icon-wrapper gradient-purple">
                <el-icon size="28"><ChatLineSquare /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <h3 class="stat-number">{{ stats.totalConversations }}</h3>
              <p class="stat-label">对话次数</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近报告列表 -->
      <div class="recent-articles">
        <div class="section-header">
          <div class="section-title-with-icon">
            <div class="section-icon">
              <el-icon size="24"><Clock /></el-icon>
            </div>
            <div>
              <h3>最近创建的报告</h3>
            </div>
          </div>
          <div class="header-actions">
            <router-link to="/webpages">
              <el-button type="primary" icon="ArrowRight" class="view-all-button">
                查看全部
              </el-button>
            </router-link>
          </div>
        </div>
        
        <div class="articles-grid" v-if="recentReports.length > 0">
          <div 
            v-for="report in recentReports" 
            :key="report.id"
            class="report-card glass-effect"
            @click="$router.push(`/reports/${report.id}`)"
          >
            <div class="card-top">
              <div class="title-area">
                <h3>{{ report.title }}</h3>
                <p class="muted">{{ report.industry }} · {{ report.scenario || '未指定场景' }}</p>
              </div>
              <el-tag :type="getStatusType(report.status)" size="small">
                {{ getStatusText(report.status) }}
              </el-tag>
            </div>
            <div class="highlights" v-if="report.highlights?.length">
              <span v-for="(item, idx) in report.highlights.slice(0, 3)" :key="idx" class="pill">
                {{ item }}
              </span>
            </div>
            <div class="meta">
              <span><el-icon><Timer /></el-icon> {{ formatDate(report.updated_at) }}</span>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <div class="empty-illustration">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#d1d5db" stroke-width="1" fill="#f9fafb"/>
              <path d="M8 12h8M12 8v8" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="empty-content">
            <h3>还没有报告</h3>
            <p>开始创建您的第一个产业报告吧！</p>
            <el-button type="primary" icon="Plus" @click="$router.push('/add-webpage')" class="start-button">
              创建第一个报告
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 快速操作面板 -->
      <div class="quick-actions">
        <div class="section-header">
          <div class="section-title-with-icon">
            <div class="section-icon">
              <el-icon size="24"><Operation /></el-icon>
            </div>
            <div>
              <h3>快速操作</h3>
            </div>
          </div>
        </div>
        
        <div class="actions-grid">
          <div class="action-card hover-lift" @click="$router.push('/add-webpage')">
            <div class="action-icon gradient-blue">
              <el-icon size="24"><Plus /></el-icon>
            </div>
            <h4>新建报告</h4>
            <p>创建新的产业研究报告</p>
          </div>
          
          <div class="action-card hover-lift" @click="$router.push('/webpages')">
            <div class="action-icon gradient-green">
              <el-icon size="24"><List /></el-icon>
            </div>
            <h4>报告管理</h4>
            <p>查看和管理所有报告</p>
          </div>
          
          <div class="action-card hover-lift" @click="$router.push('/webpages')">
            <div class="action-icon gradient-purple">
              <el-icon size="24"><Document /></el-icon>
            </div>
            <h4>报告管理</h4>
            <p>查看和管理所有报告</p>
          </div>
          
          <div class="action-card hover-lift" @click="handleViewAnalytics">
            <div class="action-icon gradient-orange">
              <el-icon size="24"><DataAnalysis /></el-icon>
            </div>
            <h4>数据分析</h4>
            <p>查看详细使用统计</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useReportsStore } from '../stores/reports'

const router = useRouter()
const authStore = useAuthStore()
const reportsStore = useReportsStore()

const recentReports = computed(() => reportsStore.reports.slice(0, 6))

const stats = computed(() => ({
  totalReports: reportsStore.reports.length,
  completedReports: reportsStore.reports.filter(r => r.status === 'completed').length,
  processingReports: reportsStore.reports.filter(r => ['drafting', 'generating'].includes(r.status)).length,
  totalConversations: reportsStore.reports.reduce((sum, report) => {
    // 假设每个报告有对话记录，这里简化处理
    return sum + (report.conversations?.length || 0)
  }, 0)
}))

function getStatusText(status) {
  const textMap = {
    draft: '已生成大纲',
    drafting: '生成中',
    generating: '撰写中',
    completed: '已完成',
    failed: '失败'
  }
  return textMap[status] || status
}

function getStatusType(status) {
  const map = {
    draft: 'info',
    drafting: 'warning',
    generating: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return map[status] || 'info'
}

function formatDate(ts) {
  if (!ts) return '刚刚'
  return new Date(ts).toLocaleString('zh-CN')
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 清除用户相关数据
    authStore.clearUserData()
    authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // 用户取消操作
  }
}

function handleViewAnalytics() {
  ElMessage.info('数据分析功能开发中...')
}

onMounted(async () => {
  await reportsStore.fetchReports()
})

// 当组件被激活时（比如从登录页跳转过来）也刷新数据
onActivated(async () => {
  if (authStore.isAuthenticated && reportsStore.reports.length === 0) {
    await reportsStore.fetchReports()
  }
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f5f5f7;
  padding: 24px;
}

/* 顶部导航样式 - Bento 风格 */
.dashboard-header {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 0 24px;
  margin-bottom: 24px;
  position: sticky;
  top: 24px;
  z-index: 100;
  transition: all 0.3s ease;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  padding: 8px;
  background: rgba(142, 142, 147, 0.1);
  border-radius: 12px;
  border: 0.5px solid rgba(142, 142, 147, 0.2);
  transition: all 0.3s ease;
}

.logo-icon:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(142, 142, 147, 0.15);
}

.logo h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1d1d1f;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-greeting {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border-radius: 18px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.user-greeting:hover {
  background: rgba(255, 255, 255, 0.7);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #86868b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.welcome-text {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.username {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  margin-top: 2px;
}

.add-button {
  height: 40px;
  padding: 0 20px;
  border-radius: 18px;
  font-weight: 600;
  background: #007AFF !important;
  border: none !important;
  color: white !important;
}

.add-button:hover {
  background: #0051D5 !important;
}

.logout-button {
  height: 40px;
  padding: 0 16px;
  border-radius: 18px;
  color: #86868b;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
}

.logout-button:hover {
  color: #1d1d1f;
  border-color: rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

/* 主内容区样式 */
.dashboard-main {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 欢迎横幅样式 - Bento 风格 */
.welcome-banner {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 40px;
  color: #1d1d1f;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.banner-text h1 {
  font-size: 40px;
  font-weight: 800;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
  color: #1d1d1f;
}

.banner-text p {
  font-size: 17px;
  color: #86868b;
  font-weight: 400;
  margin: 0;
  max-width: 500px;
  line-height: 1.5;
}

.banner-illustration {
  position: relative;
  width: 200px;
  height: 160px;
}

.floating-elements {
  position: absolute;
  width: 100%;
  height: 100%;
}

.element {
  position: absolute;
  border-radius: 50%;
  background: rgba(142, 142, 147, 0.1);
  animation: float 3s ease-in-out infinite;
}

.element-1 {
  width: 60px;
  height: 60px;
  top: 20px;
  right: 40px;
  animation-delay: 0s;
}

.element-2 {
  width: 40px;
  height: 40px;
  top: 80px;
  right: 20px;
  animation-delay: 1s;
}

.element-3 {
  width: 30px;
  height: 30px;
  top: 120px;
  right: 60px;
  animation-delay: 2s;
}

/* 统计区样式 - Bento 风格 */
.stats-section {
  background: transparent;
  padding: 0;
}

.section-title {
  text-align: left;
  margin-bottom: 24px;
}

.section-title h2 {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1d1d1f;
  margin: 0 0 8px 0;
}

.section-title p {
  color: #86868b;
  font-size: 17px;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  padding: 28px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 12px 32px rgba(0, 0, 0, 0.05);
}

.stat-background {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  opacity: 0.05;
  overflow: hidden;
}

.stat-pattern {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(142, 142, 147, 0.1) 2px, transparent 2px);
  background-size: 20px 20px;
}

.stat-icon {
  margin-bottom: 20px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.gradient-blue {
  background: #007AFF;
}

.gradient-green {
  background: #34C759;
}

.gradient-orange {
  background: #FF9500;
}

.gradient-purple {
  background: #AF52DE;
}

.stat-content {
  position: relative;
  z-index: 2;
}

.stat-number {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1d1d1f;
  margin: 0 0 8px 0;
  line-height: 1;
}

.stat-label {
  color: #86868b;
  font-size: 17px;
  font-weight: 500;
  margin: 0 0 12px 0;
}


/* 最近文章区样式 - Bento 风格 */
.recent-articles {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 32px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
}

.section-title-with-icon {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(142, 142, 147, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86868b;
}

.section-header h3 {
  margin: 0 0 4px 0;
  color: #1d1d1f;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.section-header p {
  margin: 0;
  color: #86868b;
  font-size: 15px;
}

.view-all-button {
  border-radius: 18px;
  height: 40px;
  font-weight: 600;
  background: #007AFF !important;
  border: none !important;
  color: white !important;
}

.view-all-button:hover {
  background: #0051D5 !important;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
}

.report-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.03);
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.15);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.title-area h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.muted {
  color: #86868b;
  margin: 0;
  font-size: 13px;
}

.highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.pill {
  background: rgba(0, 122, 255, 0.06);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  color: #007AFF;
  font-weight: 600;
  border: 0.5px solid rgba(0, 122, 255, 0.12);
}

.meta {
  display: flex;
  gap: 12px;
  color: #86868b;
  font-size: 13px;
  align-items: center;
  margin: 12px 0;
}

.meta span {
  display: flex;
  gap: 6px;
  align-items: center;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-illustration {
  margin-bottom: 24px;
}

.empty-content h3 {
  color: #1d1d1f;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 8px 0;
}

.empty-content p {
  color: #86868b;
  font-size: 17px;
  margin: 0 0 24px 0;
}

.start-button {
  border-radius: 18px;
  height: 44px;
  padding: 0 24px;
  font-weight: 600;
  background: #007AFF !important;
  border: none !important;
  color: white !important;
}

.start-button:hover {
  background: #0051D5 !important;
}

/* 快速操作区样式 - Bento 风格 */
.quick-actions {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 32px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.action-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.03);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.15);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
}

.action-card h4 {
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.action-card p {
  color: #86868b;
  font-size: 15px;
  margin: 0;
  line-height: 1.5;
  font-weight: 400;
}

/* 响应式设计 */
/* 统一状态标签颜色（与报告列表页面保持一致） */
.recent-articles .card-top .el-tag--success {
  background: #34C759 !important;
  color: white !important;
}

.recent-articles .card-top .el-tag--info {
  background: #5AC8FA !important;
  color: white !important;
}

.recent-articles .card-top .el-tag--warning {
  background: #FF9500 !important;
  color: white !important;
}

.recent-articles .card-top .el-tag--danger {
  background: #FF3B30 !important;
  color: white !important;
}

@media (max-width: 1024px) {
  .banner-content {
    flex-direction: column;
    text-align: center;
    gap: 32px;
  }
  
  .banner-illustration {
    width: 150px;
    height: 120px;
  }
}

@media (max-width: 768px) {
  .dashboard-main {
    padding: 20px 16px;
    gap: 32px;
  }
  
  .header-content {
    flex-direction: column;
    height: auto;
    gap: 16px;
    padding: 16px 0;
  }
  
  .user-greeting {
    order: -1;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .welcome-banner {
    padding: 24px;
  }
  
  .banner-text h1 {
    font-size: 28px;
  }
  
  .banner-text p {
    font-size: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-section,
  .recent-articles,
  .quick-actions {
    padding: 20px;
  }
}
</style>
