<template>
  <div class="reports-container">
    <!-- 顶部英雄区 -->
    <section class="hero glass-effect">
      <div class="hero-text">
        <p class="eyebrow">产业报告 · LLM + Agent</p>
        <h1>大模型驱动的产业报告智能生成</h1>
        <p class="subtext">
          多轮对话式需求澄清、自动数据抓取与结构化写作，让研究员专注于决策洞察。
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="scrollToForm" icon="EditPen">
            立即创建报告
          </el-button>
          <el-button size="large" text type="primary" @click="router.push('/dashboard')" icon="House">
            返回旧主页
          </el-button>
        </div>
        <div class="hero-tags">
          <el-tag effect="dark">多轮对话</el-tag>
          <el-tag type="success">智能大纲</el-tag>
          <el-tag type="info">自动生成</el-tag>
          <el-tag type="warning">可审计</el-tag>
        </div>
      </div>
      <div class="hero-visual">
        <div class="panel">
          <div class="panel-header">
            <span>智能体工作流</span>
            <el-tag size="small" type="success">实时</el-tag>
          </div>
          <ul class="panel-steps">
            <li><el-icon><ChatDotRound /></el-icon> 需求澄清与范围界定</li>
            <li><el-icon><DataAnalysis /></el-icon> 数据源编排与要点抽取</li>
            <li><el-icon><Document /></el-icon> 结构化写作 + 摘要</li>
            <li><el-icon><Refresh /></el-icon> 迭代优化与追问</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 创建表单 -->
    <section ref="formSection" class="form-section glass-effect">
      <div class="section-head">
        <div>
          <p class="eyebrow">新建报告</p>
          <h2>告诉我你的研究诉求</h2>
          <p class="subtext">填写场景、行业与数据来源，智能体会产出大纲与执行路径。</p>
        </div>
        <el-tag v-if="reportsStore.loading" type="info" effect="plain">
          <el-icon class="is-loading"><Loading /></el-icon> 处理中...
        </el-tag>
      </div>
      <el-form :model="form" label-position="top" @submit.prevent="handleCreate">
        <div class="form-grid">
          <el-form-item label="报告标题" required>
            <el-input v-model="form.title" placeholder="如：2025年中国智算产业发展深度报告" />
          </el-form-item>
          <el-form-item label="所属行业" required>
            <el-select v-model="form.industry" filterable placeholder="选择行业">
              <el-option v-for="item in industryOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="使用场景 / 读者">
            <el-input v-model="form.scenario" placeholder="如：投资人/战略部/销售支持" />
          </el-form-item>
          <el-form-item label="研究目标" class="full-width">
            <el-input
              v-model="form.objective"
              type="textarea"
              :rows="3"
              placeholder="阐述想解决的问题、需要的深度或重点章节"
            />
          </el-form-item>
          <el-form-item label="数据来源（上传文档）" class="full-width">
            <el-upload
              ref="fileUploadRef"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
              multiple
              class="data-source-upload"
            >
              <template #trigger>
                <el-button type="primary" icon="Upload">
                  选择文件
                </el-button>
              </template>
              <template #tip>
                <div class="upload-tip">支持 PDF、Word、图片等格式，单个文件不超过10MB</div>
              </template>
            </el-upload>
            
            <!-- 文件预览列表 -->
            <div class="uploaded-files-list" v-if="uploadedFiles.length > 0">
              <div 
                v-for="(file, index) in uploadedFiles" 
                :key="index"
                class="file-item"
              >
                <div class="file-info">
                  <el-icon class="file-icon"><Document /></el-icon>
                  <div class="file-details">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  </div>
                </div>
                <el-button 
                  size="small" 
                  text 
                  type="danger"
                  @click="removeFile(index)"
                  icon="Delete"
                >
                  删除
                </el-button>
              </div>
            </div>
            <div v-else class="empty-hint">
              <span class="hint-text">暂无数据来源，点击上方按钮上传文档</span>
            </div>
          </el-form-item>
        </div>
        <div class="actions">
          <el-button type="primary" :loading="reportsStore.loading" icon="Sparkles" @click="handleCreate">
            {{ reportsStore.loading ? '生成大纲中...' : '生成大纲' }}
          </el-button>
          <el-button @click="resetForm" text>重置</el-button>
        </div>
      </el-form>
    </section>

    <!-- 报告列表 -->
    <section class="list-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">我的报告</p>
          <h2>随时进入工作台</h2>
        </div>
        <el-button text type="primary" icon="Refresh" @click="refresh">
          刷新
        </el-button>
      </div>

      <div v-if="reportsStore.reports.length === 0" class="empty">
        <el-empty description="还没有报告，试着创建一个吧" />
      </div>

      <div class="card-grid" v-else>
        <div class="report-card glass-effect" v-for="report in reportsStore.reports" :key="report.id">
          <div class="card-top">
            <div class="title-area">
              <h3>{{ report.title }}</h3>
              <p class="muted">{{ report.industry }} · {{ report.scenario || '未指定场景' }}</p>
            </div>
            <el-tag :type="getStatusType(report.status)" size="small">
              {{ statusText(report.status) }}
            </el-tag>
          </div>
          <div class="highlights" v-if="report.highlights?.length">
            <span v-for="(item, idx) in report.highlights.slice(0, 3)" :key="idx" class="pill">
              {{ item }}
            </span>
          </div>
          <div class="meta">
            <span><el-icon><Timer /></el-icon> 更新: {{ formatDate(report.updated_at) }}</span>
            <span><el-icon><TrendCharts /></el-icon> 置信度: {{ report.metrics?.confidence || '—' }}</span>
          </div>
          <div class="card-actions">
            <el-button type="primary" size="small" @click="goDetail(report.id)">进入工作台</el-button>
            <el-button
              v-if="report.status !== 'completed'"
              size="small"
              :loading="reportsStore.loading && generatingId === report.id"
              @click="handleGenerate(report.id)"
            >
              生成正文
            </el-button>
            <el-button size="small" text @click="goDetail(report.id)">查看对话</el-button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useReportsStore } from '../stores/reports'

defineOptions({ name: 'ReportsView' })

const router = useRouter()
const reportsStore = useReportsStore()

const formSection = ref(null)
const generatingId = ref(null)
const fileUploadRef = ref(null)
const uploadedFiles = ref([]) // 上传的文件列表
const form = reactive({
  title: '',
  industry: '',
  scenario: '',
  objective: ''
})

const industryOptions = ['AI/算力', '新能源', '半导体', 'SaaS', '制造业数字化', '医疗健康', '金融科技', '消费与零售', '出行与物流', '其他']

function scrollToForm() {
  formSection.value?.scrollIntoView({ behavior: 'smooth' })
}

// 处理文件选择
function handleFileChange(file, fileList) {
  const fileObj = file.raw || file
  
  // 检查文件大小（限制为10MB）
  if (fileObj.size > 10 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过10MB')
    return
  }
  
  // 检查文件类型
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
  
  if (!allowedTypes.includes(fileObj.type)) {
    ElMessage.warning('不支持的文件类型')
    return
  }
  
  // 创建文件预览对象
  const fileData = {
    name: fileObj.name,
    size: fileObj.size,
    type: fileObj.type,
    file: fileObj
  }
  
  // 如果是图片，创建预览URL
  if (fileObj.type.startsWith('image/')) {
    fileData.preview = URL.createObjectURL(fileObj)
  }
  
  uploadedFiles.value.push(fileData)
}

// 移除文件
function removeFile(index) {
  const file = uploadedFiles.value[index]
  // 释放预览URL
  if (file.preview) {
    URL.revokeObjectURL(file.preview)
  }
  uploadedFiles.value.splice(index, 1)
}

// 处理文件移除（el-upload组件的回调）
function handleFileRemove(file, fileList) {
  // 这个回调可能不会被调用，因为我们使用 :auto-upload="false"
  // 主要使用 removeFile 函数
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function resetForm() {
  form.title = ''
  form.industry = ''
  form.scenario = ''
  form.objective = ''
  // 清理文件
  uploadedFiles.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
  uploadedFiles.value = []
  // 清空上传组件
  fileUploadRef.value?.clearFiles()
}

function statusText(status) {
  return (
    {
      draft: '已生成大纲',
      drafting: '生成中',
      generating: '撰写中',
      completed: '已完成',
      failed: '失败'
    }[status] || status
  )
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

async function handleCreate() {
  if (!form.title || !form.industry) {
    ElMessage.warning('请填写标题和行业')
    return
  }
  
  // 准备文件数据
  const files = uploadedFiles.value.map(f => f.file)
  
  const result = await reportsStore.createReport({ ...form }, files)
  if (result.success) {
    ElMessage.success('大纲生成完成，进入工作台查看')
    router.push(`/reports/${result.reportId}`)
  } else {
    ElMessage.error(result.message)
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

async function refresh() {
  await reportsStore.fetchReports()
}

function goDetail(id) {
  router.push(`/reports/${id}`)
}

onMounted(async () => {
  await reportsStore.fetchReports()
})
</script>

<style scoped>
.reports-container {
  min-height: 100vh;
  padding: 24px;
  background: #f5f5f7;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

.hero {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
  padding: 40px;
  margin-bottom: 24px;
}

.hero-text h1 {
  margin: 8px 0 12px;
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: #1d1d1f;
}

.subtext {
  color: #86868b;
  font-size: 17px;
  font-weight: 400;
  margin-bottom: 16px;
  line-height: 1.5;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.hero-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.eyebrow {
  color: #86868b;
  font-weight: 600;
  letter-spacing: 0.3px;
  font-size: 13px;
  text-transform: uppercase;
  margin: 0;
}

.hero-visual {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.panel {
  width: 100%;
  max-width: 360px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.03);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 700;
  font-size: 16px;
  color: #1d1d1f;
}

.panel-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-steps li {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  font-size: 14px;
}

.form-section {
  padding: 32px;
  margin-bottom: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-head h2 {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1d1d1f;
  margin: 8px 0 0 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-grid .full-width {
  grid-column: 1 / -1;
}

.data-source-upload {
  width: 100%;
}

.upload-tip {
  margin-top: 8px;
  color: #86868b;
  font-size: 13px;
  font-weight: 400;
}

.uploaded-files-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  transition: all 0.3s ease;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.03);
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.05);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 20px;
  color: #606266;
  flex-shrink: 0;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #1d1d1f;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #86868b;
}

.empty-hint {
  margin-top: 12px;
}

.hint-text {
  color: #86868b;
  font-size: 13px;
  font-weight: 400;
  font-style: italic;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.list-section {
  padding: 0;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.report-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
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
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.title-area h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
}

.muted {
  color: #86868b;
  font-size: 13px;
  margin: 0;
  font-weight: 400;
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
  font-weight: 400;
}

.meta span {
  display: flex;
  gap: 6px;
  align-items: center;
}

.card-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.empty {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  padding: 48px;
  border: 0.5px dashed rgba(0, 0, 0, 0.1);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
}

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-grid .full-width {
    grid-column: 1;
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

:deep(.el-button.is-text) {
  color: #86868b;
  border-radius: 18px;
}

:deep(.el-button.is-text:hover) {
  color: #1d1d1f;
  background: rgba(142, 142, 147, 0.1);
}
</style>

