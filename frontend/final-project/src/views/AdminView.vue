<template>
  <div class="admin-container">
    <!-- 顶部导航 -->
    <header class="admin-header glass-effect">
      <div class="header-content">
        <div class="page-title">
          <h2>管理员面板</h2>
          <p>系统管理和数据统计</p>
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
          <el-button @click="handleLogout" icon="SwitchButton" class="logout-button">退出</el-button>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="admin-main">
      <!-- Bento 风格统计卡片网格 -->
      <div class="bento-grid">
        <!-- 大卡片 - 总用户数 -->
        <div class="bento-card bento-large stat-card-primary">
          <div class="bento-content">
            <div class="bento-icon-wrapper">
              <div class="bento-icon icon-blue">
                <el-icon size="40"><User /></el-icon>
              </div>
            </div>
            <div class="bento-text">
              <div class="bento-value">{{ stats.totalUsers }}</div>
              <div class="bento-label">总用户数</div>
            </div>
          </div>
        </div>
        
        <!-- 中等卡片 - 总报告数 -->
        <div class="bento-card bento-medium stat-card-secondary">
          <div class="bento-content">
            <div class="bento-icon-wrapper">
              <div class="bento-icon icon-green">
                <el-icon size="32"><Document /></el-icon>
              </div>
            </div>
            <div class="bento-text">
              <div class="bento-value">{{ stats.totalReports }}</div>
              <div class="bento-label">总报告数</div>
            </div>
          </div>
        </div>
        
        <!-- 小卡片 - 总对话数 -->
        <div class="bento-card bento-small stat-card-accent">
          <div class="bento-content">
            <div class="bento-icon-wrapper">
              <div class="bento-icon icon-purple">
                <el-icon size="28"><ChatDotRound /></el-icon>
              </div>
            </div>
            <div class="bento-text">
              <div class="bento-value">{{ stats.totalConversations }}</div>
              <div class="bento-label">总对话数</div>
            </div>
          </div>
        </div>
        
        <!-- 小卡片 - 已完成报告 -->
        <div class="bento-card bento-small stat-card-accent">
          <div class="bento-content">
            <div class="bento-icon-wrapper">
              <div class="bento-icon icon-orange">
                <el-icon size="28"><TrendCharts /></el-icon>
              </div>
            </div>
            <div class="bento-text">
              <div class="bento-value">{{ stats.completedReports }}</div>
              <div class="bento-label">已完成报告</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" class="admin-tabs">
        <!-- 用户管理 -->
        <el-tab-pane label="用户管理" name="users">
          <div class="tab-content">
            <div class="toolbar">
              <el-input
                v-model="userSearchKeyword"
                placeholder="搜索用户名或邮箱"
                style="width: 300px"
                clearable
                @input="handleUserSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="info" icon="Refresh" @click="fetchUsers" class="refresh-button">
                刷新
              </el-button>
            </div>
            
            <el-table
              :data="paginatedUsers"
              v-loading="usersLoading"
              stripe
              style="width: 100%"
              :height="600"
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" width="150" />
              <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
              <el-table-column prop="created_at" label="注册时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="报告数" width="100" align="center">
                <template #default="{ row }">
                  {{ getUserReportCount(row.id) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button
                    size="small"
                    type="danger"
                    text
                    @click="handleDeleteUser(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <el-pagination
              v-model:current-page="userPage"
              v-model:page-size="userPageSize"
              :total="filteredUsers.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              class="pagination"
            />
          </div>
        </el-tab-pane>

        <!-- 报告管理 -->
        <el-tab-pane label="报告管理" name="reports">
          <div class="tab-content">
            <div class="toolbar">
              <el-select v-model="reportStatusFilter" placeholder="按状态筛选" clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="已生成大纲" value="draft" />
                <el-option label="生成中" value="drafting" />
                <el-option label="撰写中" value="generating" />
                <el-option label="已完成" value="completed" />
                <el-option label="失败" value="failed" />
              </el-select>
              
              <el-input
                v-model="reportSearchKeyword"
                placeholder="搜索报告标题"
                style="width: 300px"
                clearable
                @input="handleReportSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              
              <el-button type="info" icon="Refresh" @click="fetchReports" class="refresh-button">
                刷新
              </el-button>
            </div>
            
            <el-table
              :data="paginatedReports"
              v-loading="reportsLoading"
              stripe
              style="width: 100%"
              :height="600"
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="title" label="标题" min-width="250" show-overflow-tooltip />
              <el-table-column prop="industry" label="行业" width="120" />
              <el-table-column prop="status" label="状态" width="130" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="user_id" label="用户ID" width="100" align="center" />
              <el-table-column prop="created_at" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right" align="center">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <el-button
                      size="small"
                      text
                      @click="$router.push(`/reports/${row.id}`)"
                    >
                      查看
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      text
                      @click="handleDeleteReport(row)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            
            <el-pagination
              v-model:current-page="reportPage"
              v-model:page-size="reportPageSize"
              :total="filteredReports.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              class="pagination"
            />
          </div>
        </el-tab-pane>

        <!-- 系统统计 -->
        <el-tab-pane label="系统统计" name="statistics">
          <div class="tab-content">
            <div class="statistics-grid">
              <div class="statistics-card glass-effect">
                <h3>用户增长趋势</h3>
                <div class="stat-item">
                  <span class="label">今日新增用户:</span>
                  <span class="value">{{ stats.newUsersToday }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">本周新增用户:</span>
                  <span class="value">{{ stats.newUsersThisWeek }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">本月新增用户:</span>
                  <span class="value">{{ stats.newUsersThisMonth }}</span>
                </div>
              </div>
              
              <div class="statistics-card glass-effect">
                <h3>报告统计</h3>
                <div class="stat-item">
                  <span class="label">今日创建报告:</span>
                  <span class="value">{{ stats.newReportsToday }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">本周创建报告:</span>
                  <span class="value">{{ stats.newReportsThisWeek }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">本月创建报告:</span>
                  <span class="value">{{ stats.newReportsThisMonth }}</span>
                </div>
              </div>
              
              <div class="statistics-card glass-effect">
                <h3>报告状态分布</h3>
                <div class="stat-item">
                  <span class="label">草稿:</span>
                  <span class="value">{{ stats.reportsByStatus.draft || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">生成中:</span>
                  <span class="value">{{ stats.reportsByStatus.drafting || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">已完成:</span>
                  <span class="value">{{ stats.reportsByStatus.completed || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">失败:</span>
                  <span class="value">{{ stats.reportsByStatus.failed || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

defineOptions({ name: 'AdminView' })

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('users')
const usersLoading = ref(false)
const reportsLoading = ref(false)

// 统计数据
const stats = ref({
  totalUsers: 0,
  totalReports: 0,
  totalConversations: 0,
  completedReports: 0,
  newUsersToday: 0,
  newUsersThisWeek: 0,
  newUsersThisMonth: 0,
  newReportsToday: 0,
  newReportsThisWeek: 0,
  newReportsThisMonth: 0,
  reportsByStatus: {}
})

// 用户管理
const users = ref([])
const userSearchKeyword = ref('')
const userPage = ref(1)
const userPageSize = ref(20)

const filteredUsers = computed(() => {
  let result = users.value
  if (userSearchKeyword.value) {
    const keyword = userSearchKeyword.value.toLowerCase()
    result = result.filter(user => 
      user.username.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    )
  }
  return result
})

// 分页后的用户列表
const paginatedUsers = computed(() => {
  const start = (userPage.value - 1) * userPageSize.value
  const end = start + userPageSize.value
  return filteredUsers.value.slice(start, end)
})

// 报告管理
const reports = ref([])
const reportStatusFilter = ref('')
const reportSearchKeyword = ref('')
const reportPage = ref(1)
const reportPageSize = ref(20)

const filteredReports = computed(() => {
  let result = reports.value
  if (reportStatusFilter.value) {
    result = result.filter(r => r.status === reportStatusFilter.value)
  }
  if (reportSearchKeyword.value) {
    const keyword = reportSearchKeyword.value.toLowerCase()
    result = result.filter(r => 
      r.title?.toLowerCase().includes(keyword)
    )
  }
  return result
})

// 分页后的报告列表
const paginatedReports = computed(() => {
  const start = (reportPage.value - 1) * reportPageSize.value
  const end = start + reportPageSize.value
  return filteredReports.value.slice(start, end)
})

// 获取用户报告数
function getUserReportCount(userId) {
  return reports.value.filter(r => r.user_id === userId).length
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 状态相关
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

// 搜索处理
function handleUserSearch() {
  userPage.value = 1
}

function handleReportSearch() {
  reportPage.value = 1
}

const API_BASE_URL = 'http://localhost:3000/api'

// 获取统计数据
async function fetchStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`)
    if (response.data) {
      stats.value = { ...stats.value, ...response.data }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error(error.response?.data?.error || '获取统计数据失败')
  }
}

// 获取用户列表
async function fetchUsers() {
  usersLoading.value = true
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/users`)
    if (response.data) {
      users.value = response.data || []
      console.log('用户列表加载成功，共', users.value.length, '条')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error(error.response?.data?.error || '获取用户列表失败')
  } finally {
    usersLoading.value = false
  }
}

// 获取报告列表
async function fetchReports() {
  reportsLoading.value = true
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/reports`)
    if (response.data) {
      reports.value = response.data || []
      console.log('报告列表加载成功，共', reports.value.length, '条')
    }
  } catch (error) {
    console.error('获取报告列表失败:', error)
    ElMessage.error(error.response?.data?.error || '获取报告列表失败')
  } finally {
    reportsLoading.value = false
  }
}

// 删除用户
async function handleDeleteUser(user) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作将删除该用户的所有数据，且无法恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
    
    await axios.delete(`${API_BASE_URL}/admin/users/${user.id}`)
    ElMessage.success('用户删除成功')
    await fetchUsers()
    await fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error(error.response?.data?.error || '删除用户失败')
    }
  }
}

// 删除报告
async function handleDeleteReport(report) {
  try {
    await ElMessageBox.confirm(
      `确定要删除报告 "${report.title}" 吗？此操作无法恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await axios.delete(`${API_BASE_URL}/admin/reports/${report.id}`)
    ElMessage.success('报告删除成功')
    await fetchReports()
    await fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除报告失败:', error)
      ElMessage.error(error.response?.data?.error || '删除报告失败')
    }
  }
}

// 退出登录
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

onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchUsers(),
    fetchReports()
  ])
})
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
  padding: 24px;
}

.admin-header {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  padding: 24px 32px;
  margin-bottom: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
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
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  transition: all 0.2s ease;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.welcome-text {
  font-size: 12px;
  color: #64748b;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.logout-button {
  border-radius: 18px;
  padding: 8px 20px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
}

.logout-button:hover {
  background: rgba(255, 59, 48, 0.1);
  border-color: rgba(255, 59, 48, 0.3);
  color: #FF3B30;
}

.page-title h2 {
  margin: 0 0 4px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.02em;
}

.page-title p {
  margin: 0;
  color: #86868b;
  font-size: 15px;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.admin-main {
  max-width: 1400px;
  margin: 0 auto;
}

/* Bento 风格网格布局 */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto auto;
  gap: 16px;
  margin-bottom: 24px;
}

.bento-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 24px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.bento-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.bento-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 16px 40px rgba(0, 0, 0, 0.06);
}

.bento-card:hover::before {
  opacity: 1;
}

.bento-large {
  grid-column: span 2;
  grid-row: span 1;
}

.bento-medium {
  grid-column: span 1;
  grid-row: span 1;
}

.bento-small {
  grid-column: span 1;
  grid-row: span 1;
}

.bento-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.bento-icon-wrapper {
  display: flex;
  align-items: flex-start;
}

.bento-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.bento-large .bento-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
}

.bento-small .bento-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
}

.icon-blue {
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
}

.icon-green {
  background: linear-gradient(135deg, #34C759 0%, #28A745 100%);
}

.icon-purple {
  background: linear-gradient(135deg, #AF52DE 0%, #8E44AD 100%);
}

.icon-orange {
  background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%);
}

.bento-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.bento-value {
  font-size: 48px;
  font-weight: 700;
  color: #1d1d1f;
  line-height: 1;
  letter-spacing: -0.02em;
}

.bento-large .bento-value {
  font-size: 64px;
}

.bento-small .bento-value {
  font-size: 36px;
}

.bento-label {
  font-size: 15px;
  font-weight: 500;
  color: #86868b;
  letter-spacing: -0.01em;
}

.bento-large .bento-label {
  font-size: 17px;
}

.stat-card-primary {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, rgba(0, 81, 213, 0.05) 100%);
}

.stat-card-secondary {
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.08) 0%, rgba(40, 167, 69, 0.05) 100%);
}

.stat-card-accent {
  background: linear-gradient(135deg, rgba(175, 82, 222, 0.08) 0%, rgba(142, 68, 173, 0.05) 100%);
}

.stats-grid {
  display: none;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .bento-large {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  
  .bento-large,
  .bento-medium,
  .bento-small {
    grid-column: span 1;
  }
}

.admin-tabs {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  padding: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.admin-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.admin-tabs :deep(.el-tabs__item) {
  font-weight: 500;
  font-size: 15px;
  padding: 0 20px;
  transition: all 0.2s ease;
  color: #86868b;
}

.admin-tabs :deep(.el-tabs__item:hover) {
  color: #1d1d1f;
}

.admin-tabs :deep(.el-tabs__item.is-active) {
  color: #007AFF;
  font-weight: 600;
}

.admin-tabs :deep(.el-tabs__active-bar) {
  background: #007AFF;
  height: 2px;
  border-radius: 1px;
}

.tab-content {
  min-height: 400px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border-radius: 16px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.statistics-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  padding: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
}

.statistics-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 16px 40px rgba(0, 0, 0, 0.06);
}

.statistics-card h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.01em;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item .label {
  color: #86868b;
  font-size: 15px;
  font-weight: 500;
}

.stat-item .value {
  color: #1d1d1f;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
}

/* Element Plus 组件 Bento 风格优化 */
.admin-tabs :deep(.el-table) {
  border-radius: 16px;
  overflow: hidden;
  background: transparent;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
}

.admin-tabs :deep(.el-table__header) {
  background: rgba(248, 248, 248, 0.8);
}

.admin-tabs :deep(.el-table__header th) {
  background: transparent;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  color: #86868b;
  font-weight: 600;
  font-size: 13px;
  padding: 16px 12px;
}

.admin-tabs :deep(.el-table__body tr) {
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.5);
}

.admin-tabs :deep(.el-table__body tr:hover) {
  background: rgba(0, 122, 255, 0.05);
}

.admin-tabs :deep(.el-table__body td) {
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
  padding: 16px 12px;
  color: #1d1d1f;
}

.admin-tabs :deep(.el-table--striped .el-table__body tr.el-table__row--striped) {
  background: rgba(248, 248, 248, 0.5);
}

.admin-tabs :deep(.el-table--striped .el-table__body tr.el-table__row--striped:hover) {
  background: rgba(0, 122, 255, 0.05);
}

.admin-tabs :deep(.el-button) {
  border-radius: 18px;
  font-weight: 500;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.admin-tabs :deep(.el-button--primary) {
  background: #007AFF;
  border-color: #007AFF;
  color: white;
}

.admin-tabs :deep(.el-button--primary:hover) {
  background: #0051D5;
  border-color: #0051D5;
}

.admin-tabs :deep(.el-button.is-text) {
  border: none;
}

.admin-tabs :deep(.el-button--danger.is-text) {
  color: #FF3B30;
}

.admin-tabs :deep(.el-button--danger.is-text:hover) {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

.admin-tabs :deep(.el-input__wrapper) {
  border-radius: 18px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  box-shadow: none;
  transition: all 0.2s ease;
}

.admin-tabs :deep(.el-input__wrapper:hover) {
  border-color: rgba(0, 122, 255, 0.3);
}

.admin-tabs :deep(.el-input__wrapper.is-focus) {
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.admin-tabs :deep(.el-select .el-input__wrapper) {
  border-radius: 18px;
}

.admin-tabs :deep(.el-tag) {
  border-radius: 12px;
  border: none;
  font-weight: 500;
  padding: 4px 12px;
}

.admin-tabs :deep(.el-pagination) {
  font-weight: 500;
}

.admin-tabs :deep(.el-pagination .el-pager li) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.admin-tabs :deep(.el-pagination .el-pager li.is-active) {
  background: #007AFF;
  color: white;
}

/* 操作按钮布局优化 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
}

.action-buttons .el-button {
  flex-shrink: 0;
  white-space: nowrap;
}

/* 刷新按钮样式 - 灰色 */
.refresh-button {
  background: rgba(142, 142, 147, 0.1) !important;
  border-color: rgba(142, 142, 147, 0.3) !important;
  color: #8e8e93 !important;
  font-weight: 500;
}

.refresh-button:hover {
  background: rgba(142, 142, 147, 0.2) !important;
  border-color: rgba(142, 142, 147, 0.5) !important;
  color: #636366 !important;
}

/* 表格高度和布局优化 */
.admin-tabs :deep(.el-table) {
  min-height: 600px;
}

.admin-tabs :deep(.el-table__body-wrapper) {
  max-height: 600px;
  overflow-y: auto;
}

/* 状态标签优化 - 防止文本遮挡 */
.admin-tabs :deep(.el-tag) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  padding: 4px 10px;
}
</style>

<!-- 全局样式 - 用于覆盖 Element Plus MessageBox -->
<style>
/* Bento 风格对话框样式 - 全局作用域 */
.el-message-box {
  border-radius: 24px !important;
  border: 0.5px solid rgba(0, 0, 0, 0.1) !important;
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: saturate(180%) blur(20px) !important;
  -webkit-backdrop-filter: saturate(180%) blur(20px) !important;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03) !important;
  padding: 0 !important;
  overflow: hidden;
}

.el-message-box__header {
  padding: 24px 24px 16px 24px !important;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08) !important;
  background: transparent !important;
}

.el-message-box__title {
  font-size: 20px !important;
  font-weight: 700 !important;
  color: #1d1d1f !important;
  letter-spacing: -0.01em !important;
  padding-left: 0 !important;
}

.el-message-box__headerbtn {
  top: 20px !important;
  right: 20px !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 16px !important;
  transition: all 0.2s ease !important;
}

.el-message-box__headerbtn:hover {
  background: rgba(0, 0, 0, 0.05) !important;
}

.el-message-box__close {
  color: #86868b !important;
  font-size: 18px !important;
}

.el-message-box__content {
  padding: 24px !important;
  background: transparent !important;
}

.el-message-box__message {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding-left: 0 !important;
}

.el-message-box__message p {
  margin: 0 !important;
  font-size: 15px !important;
  color: #1d1d1f !important;
  font-weight: 400 !important;
  line-height: 1.5 !important;
}

.el-message-box__status {
  font-size: 24px !important;
  top: 0 !important;
}

.el-message-box__status.el-icon {
  color: #FF9500 !important;
}

.el-message-box__btns {
  padding: 16px 24px 24px 24px !important;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08) !important;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
}

.el-message-box__btns .el-button {
  border-radius: 18px !important;
  padding: 10px 24px !important;
  font-weight: 500 !important;
  font-size: 15px !important;
  transition: all 0.2s ease !important;
  border: 0.5px solid rgba(0, 0, 0, 0.1) !important;
}

.el-message-box__btns .el-button--default {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: saturate(180%) blur(10px) !important;
  -webkit-backdrop-filter: saturate(180%) blur(10px) !important;
  color: #1d1d1f !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
}

.el-message-box__btns .el-button--default:hover {
  background: rgba(0, 0, 0, 0.05) !important;
  border-color: rgba(0, 0, 0, 0.15) !important;
}

.el-message-box__btns .el-button--primary {
  background: #007AFF !important;
  border-color: #007AFF !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3) !important;
}

.el-message-box__btns .el-button--primary:hover {
  background: #0051D5 !important;
  border-color: #0051D5 !important;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4) !important;
  transform: translateY(-1px) !important;
}

/* 对话框遮罩层 */
.el-overlay {
  background: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}
</style>

