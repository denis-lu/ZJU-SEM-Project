<template>
  <div class="articles-container">
    <!-- 顶部导航 -->
    <header class="articles-header">
      <div class="header-content">
        <div class="page-title">
          <h2>我的报告</h2>
          <p>管理和查看您创建的所有报告</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" icon="Plus" @click="$router.push('/add-webpage')">
            新建报告
          </el-button>
          <el-button @click="$router.push('/dashboard')" icon="House">
            返回首页
          </el-button>
        </div>
      </div>
    </header>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="filter-content">
        <div class="filter-left">
          <el-select v-model="statusFilter" placeholder="按状态筛选" clearable @change="handleFilter" style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="已生成大纲" value="draft" />
            <el-option label="生成中" value="drafting" />
            <el-option label="撰写中" value="generating" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
          
          <el-select v-model="industryFilter" placeholder="按行业筛选" clearable @change="handleFilter" style="width: 150px">
            <el-option label="全部" value="" />
            <el-option 
              v-for="industry in availableIndustries" 
              :key="industry" 
              :label="industry" 
              :value="industry" 
            />
          </el-select>
          
          <el-input
            v-model="searchKeyword"
            placeholder="搜索报告标题、行业或场景"
            style="width: 300px"
            @input="handleSearch"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="filter-right">
          <el-button @click="refreshReports" icon="Refresh" :loading="reportsStore.loading">
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 筛选状态显示 -->
    <div v-if="hasActiveFilters" class="filter-status">
      <div class="status-content">
        <span class="status-label">当前筛选：</span>
        <div class="status-tags">
          <el-tag 
            v-if="statusFilter" 
            type="info" 
            closable 
            @close="statusFilter = ''; handleFilter()"
            class="status-tag"
          >
            状态：{{ getStatusText(statusFilter) }}
          </el-tag>
          <el-tag 
            v-if="industryFilter" 
            type="success" 
            closable 
            @close="industryFilter = ''; handleFilter()"
            class="status-tag"
          >
            行业：{{ industryFilter }}
          </el-tag>
          <el-tag 
            v-if="searchKeyword" 
            type="warning" 
            closable 
            @close="searchKeyword = ''; handleFilter()"
            class="status-tag"
          >
            搜索：{{ searchKeyword }}
          </el-tag>
        </div>
        <el-button 
          size="small" 
          type="info" 
          text
          @click="clearAllFilters"
          class="clear-all-btn"
        >
          清除全部
        </el-button>
      </div>
    </div>

    <!-- 报告列表 -->
    <div class="articles-main">
      <div v-if="reportsStore.loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="filteredReports.length > 0" class="articles-grid">
        <div 
          v-for="report in filteredReports" 
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
            <span><el-icon><Timer /></el-icon> 更新: {{ formatDate(report.updated_at) }}</span>
            <span v-if="getWordCount(report) > 0"><el-icon><Document /></el-icon> {{ formatWordCount(getWordCount(report)) }}</span>
            <span v-if="report.metrics?.confidence"><el-icon><TrendCharts /></el-icon> 置信度: {{ report.metrics.confidence }}</span>
          </div>
          <div class="card-actions">
            <el-button 
              type="primary" 
              size="small" 
              class="primary-action"
              @click.stop="$router.push(`/reports/${report.id}`)"
            >
              进入工作台
            </el-button>
            <div class="secondary-actions">
              <el-button
                size="small"
                text
                @click.stop="handleEdit(report)"
                icon="Edit"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                text
                @click.stop="handleExport(report)"
                icon="Download"
              >
                导出
              </el-button>
              <el-button
                v-if="report.status !== 'completed'"
                size="small"
                text
                :loading="reportsStore.loading && generatingId === report.id"
                @click.stop="handleGenerate(report.id)"
              >
                生成正文
              </el-button>
              <el-button
                size="small"
                type="danger"
                text
                :loading="reportsStore.loading && deletingId === report.id"
                @click.stop="handleDelete(report.id)"
                icon="Delete"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <el-empty v-else description="暂无符合条件的报告，点击上方按钮创建一个吧" />
    </div>

    <!-- 编辑报告对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑报告信息"
      width="500px"
      @close="editingReport = null"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="报告标题" required>
          <el-input v-model="editForm.title" placeholder="请输入报告标题" />
        </el-form-item>
        <el-form-item label="所属行业" required>
          <el-select v-model="editForm.industry" filterable placeholder="选择行业" style="width: 100%">
            <el-option v-for="item in industryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用场景">
          <el-input v-model="editForm.scenario" placeholder="如：投资人/战略部/销售支持" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit" :loading="reportsStore.loading">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useReportsStore } from '../stores/reports'

const router = useRouter()
const reportsStore = useReportsStore()

const statusFilter = ref('')
const industryFilter = ref('')
const searchKeyword = ref('')
const generatingId = ref(null)
const deletingId = ref(null)
const editingReport = ref(null)
const editDialogVisible = ref(false)
const editForm = reactive({
  title: '',
  industry: '',
  scenario: ''
})

const industryOptions = ['AI/算力', '新能源', '半导体', 'SaaS', '制造业数字化', '医疗健康', '金融科技', '消费与零售', '出行与物流', '其他']

// 获取所有可用的行业
const availableIndustries = computed(() => {
  const industries = new Set()
  reportsStore.reports.forEach(report => {
    if (report.industry) {
      industries.add(report.industry)
    }
  })
  return Array.from(industries).sort()
})

const filteredReports = computed(() => {
  let reports = reportsStore.reports
  
  // 状态筛选
  if (statusFilter.value) {
    reports = reports.filter(report => report.status === statusFilter.value)
  }
  
  // 行业筛选
  if (industryFilter.value) {
    reports = reports.filter(report => report.industry === industryFilter.value)
  }
  
  // 关键词搜索（标题、行业、场景）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    reports = reports.filter(report => {
      const titleMatch = report.title && report.title.toLowerCase().includes(keyword)
      const industryMatch = report.industry && report.industry.toLowerCase().includes(keyword)
      const scenarioMatch = report.scenario && report.scenario.toLowerCase().includes(keyword)
      
      return titleMatch || industryMatch || scenarioMatch
    })
  }
  
  return reports
})

// 检查是否有活动的筛选条件
const hasActiveFilters = computed(() => {
  return statusFilter.value || industryFilter.value || searchKeyword.value
})

// 获取状态文本
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

async function refreshReports() {
  await reportsStore.fetchReports()
}

function handleFilter() {
  // 筛选逻辑已在 computed 中处理
}

function handleSearch() {
  // 搜索逻辑已在 computed 中处理
}

// 清除所有筛选条件
function clearAllFilters() {
  statusFilter.value = ''
  industryFilter.value = ''
  searchKeyword.value = ''
}

// 获取报告字数
function getWordCount(report) {
  if (!report.content) return 0
  // 移除 Markdown 标记和 HTML 标签，计算纯文本字数
  const text = report.content
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`[^`]*`/g, '') // 移除行内代码
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1') // 移除链接，保留文本
    .replace(/[#*\-_=~>]/g, '') // 移除 Markdown 标记
    .replace(/<[^>]*>/g, '') // 移除 HTML 标签
    .trim()
  return text.length
}

// 格式化字数显示
function formatWordCount(count) {
  if (count < 1000) {
    return `${count}字`
  } else if (count < 10000) {
    return `${(count / 1000).toFixed(1)}千字`
  } else {
    return `${(count / 10000).toFixed(1)}万字`
  }
}

// 编辑报告基本信息
function handleEdit(report) {
  editingReport.value = report
  editForm.title = report.title || ''
  editForm.industry = report.industry || ''
  editForm.scenario = report.scenario || ''
  editDialogVisible.value = true
}

// 保存编辑
async function handleSaveEdit() {
  if (!editForm.title || !editForm.industry) {
    ElMessage.warning('请填写标题和行业')
    return
  }
  
  if (!editingReport.value) return
  
  const result = await reportsStore.updateReportInfo(editingReport.value.id, {
    title: editForm.title,
    industry: editForm.industry,
    scenario: editForm.scenario
  })
  
  if (result.success) {
    ElMessage.success('报告信息已更新')
    editDialogVisible.value = false
    await refreshReports()
  } else {
    ElMessage.error(result.message)
  }
}

// 导出报告
async function handleExport(report) {
  try {
    // 如果列表中的内容被截断，需要获取完整内容
    let content = report.content
    
    // 如果内容看起来被截断了（以...结尾），或者内容为空，从后端获取完整内容
    if (!content || content.endsWith('...') || content.length < 100) {
      const result = await reportsStore.fetchReportDetail(report.id)
      if (result.success && result.data?.content) {
        content = result.data.content
      } else {
        ElMessage.warning('无法获取报告内容，请先在工作台生成报告正文')
        return
      }
    }
    
    if (!content || !content.trim()) {
      ElMessage.warning('报告内容为空，无法导出')
      return
    }
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title || 'report'}.md`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('报告已导出')
  } catch (error) {
    console.error('导出报告失败:', error)
    ElMessage.error('导出报告失败')
  }
}

async function handleGenerate(id) {
  generatingId.value = id
  const result = await reportsStore.generateReport(id)
  generatingId.value = null
  if (result.success) {
    ElMessage.success('报告已生成')
  } else {
    ElMessage.error(result.message)
  }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个报告吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    deletingId.value = id
    const result = await reportsStore.deleteReport(id)
    deletingId.value = null
    
    if (result.success) {
      ElMessage.success('报告已删除')
      // 刷新列表
      await refreshReports()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除
    if (error !== 'cancel') {
      console.error('删除报告失败:', error)
    }
  }
}

onMounted(async () => {
  await refreshReports()
})

onActivated(async () => {
  // 当页面被激活时（比如从其他页面返回），刷新报告列表
  await refreshReports()
})
</script>

<style scoped>
.articles-container {
  /* Bento 风格主题变量（局部组件变量） */
  --bento-bg: #f7fafc;
  --bento-surface: #ffffff;
  --bento-primary: #075985; /* 主色（深青蓝）*/
  --bento-primary-600: #054a6f; /* 主色 hover */
  --bento-muted: #6b7280;
  --bento-text: #0f1724;
  --bento-pill-bg: rgba(7,89,134,0.06);
  --bento-pill-border: rgba(7,89,134,0.12);
  --bento-success: #34c759;
  --bento-warning: #ffb020;
  --bento-danger: #ff3b30;
  --shadow-lg: 0 12px 24px rgba(2,6,23,0.08);

  min-height: 100vh;
  background: var(--bento-bg);
  padding: 24px;
}

.articles-header {
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
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 0;
}

.page-title h2 {
  margin: 0 0 4px 0;
  color: var(--bento-text);
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.page-title p {
  margin: 0;
  color: var(--bento-muted);
  font-size: 17px;
  font-weight: 400;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions :deep(.el-button) {
  border-radius: 18px;
  font-weight: 500;
  font-size: 14px;
  padding: 10px 20px;
  height: auto;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.header-actions :deep(.el-button--primary) {
  background: var(--bento-primary) !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(7,89,134,0.18) !important;
}

.header-actions :deep(.el-button--primary:hover) {
  background: var(--bento-primary-600) !important;
  box-shadow: 0 4px 12px rgba(5,74,111,0.22) !important;
  transform: translateY(-1px);
}

.header-actions :deep(.el-button:not(.el-button--primary)) {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border: 0.5px solid rgba(0, 0, 0, 0.1) !important;
  color: #86868b !important;
}

.header-actions :deep(.el-button:not(.el-button--primary):hover) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(0, 0, 0, 0.15) !important;
  color: #1d1d1f !important;
}

.header-actions :deep(.el-button .el-icon) {
  font-size: 16px;
}

.filter-section {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 0;
}

.filter-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.articles-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

.loading-container {
  padding: 24px;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.glass-effect {
  background: var(--bento-surface);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
}

.report-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
  position: relative;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 12px 32px rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.15);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.title-area {
  flex: 1;
  min-width: 0;
}

.title-area h3 {
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.02em;
}

.muted {
  color: #64748b;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.pill {
  background: var(--bento-pill-bg);
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 13px;
  color: var(--bento-primary);
  font-weight: 600;
  border: 0.5px solid var(--bento-pill-border);
  transition: all 0.18s ease;
  box-shadow: 0 1px 2px rgba(7,89,134,0.03);
}

.pill:hover {
  background: rgba(7,89,134,0.09);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(7,89,134,0.06);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #64748b;
  font-size: 12px;
  align-items: center;
  margin: 16px 0;
  padding: 12px 0;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.meta span {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
  white-space: nowrap;
  font-weight: 500;
}

.meta .el-icon {
  color: #94a3b8;
  font-size: 14px;
}

.card-actions {
  margin-top: 16px;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-actions .primary-action {
  width: 100%;
  background: var(--bento-primary) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(7,89,134,0.18) !important;
  border-radius: 18px !important;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 20px;
  height: auto;
  min-height: 36px;
  transition: all 0.2s ease;
  color: white !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.card-actions .primary-action:hover {
  background: var(--bento-primary-600) !important;
  box-shadow: 0 4px 12px rgba(5,74,111,0.22) !important;
  transform: translateY(-1px);
}

.secondary-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.secondary-actions .el-button {
  flex-shrink: 0;
  white-space: nowrap;
  border-radius: 12px;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
  padding: 6px 12px;
  height: auto;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: fit-content;
}

.secondary-actions .el-button.is-text {
  color: #1d1d1f;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 6px 14px;
}

.secondary-actions .el-button.is-text:hover {
  color: #1d1d1f;
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.secondary-actions .el-button--danger.is-text {
  color: #FF3B30;
  background: rgba(255, 59, 48, 0.08);
  border-color: rgba(255, 59, 48, 0.2);
}

.secondary-actions .el-button--danger.is-text:hover {
  color: #FF3B30;
  background: rgba(255, 59, 48, 0.15);
  border-color: rgba(255, 59, 48, 0.3);
  box-shadow: 0 1px 3px rgba(255, 59, 48, 0.2);
}

.secondary-actions .el-button .el-icon {
  font-size: 16px;
}

.secondary-actions .el-button.is-text .el-icon {
  color: inherit;
}

.secondary-actions .el-button--danger.is-text .el-icon {
  color: #FF3B30;
}

/* 状态标签样式优化 */
.card-top .el-tag {
  border-radius: 12px;
  padding: 4px 12px;
  font-weight: 600;
  font-size: 12px;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.card-top .el-tag--success {
  background: var(--bento-success);
  color: white;
}

.card-top .el-tag--info {
  background: var(--bento-primary);
  color: white;
}

.card-top .el-tag--warning {
  background: var(--bento-warning);
  color: white;
}

.card-top .el-tag--danger {
  background: var(--bento-danger);
  color: white;
}

/* 筛选状态显示样式 */
.filter-status {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  margin: 0 24px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-content {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
}

.status-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.status-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.status-tag {
  font-size: 13px;
  font-weight: 500;
}

/* 筛选状态标签颜色覆盖 */
.filter-status .el-tag--info {
  background: #5AC8FA !important;
  color: white !important;
  border: none !important;
}

.clear-all-btn {
  font-size: 13px;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-left {
    flex-direction: column;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
