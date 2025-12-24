<template>
  <div class="add-article-container">
    <!-- 顶部导航 -->
    <header class="add-header">
      <div class="header-content">
        <div class="page-title">
          <h2>新建报告</h2>
          <p>填写场景、行业与数据来源，智能体会产出大纲与执行路径</p>
        </div>
        <el-button @click="$router.push('/webpages')" icon="ArrowLeft">返回</el-button>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="add-main">
      <div class="form-container">
        <!-- 创建报告表单 -->
        <div class="url-form-card">
          <h3><el-icon><Document /></el-icon> 告诉我你的研究诉求</h3>
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit" label-position="top">
            <div class="form-grid">
              <el-form-item label="报告标题" prop="title" required>
                <el-input
                  v-model="form.title"
                  placeholder="如：2025年中国智算产业发展深度报告"
                  size="large"
                />
              </el-form-item>
              
              <el-form-item label="所属行业" prop="industry" required>
                <el-select 
                  v-model="form.industry" 
                  filterable 
                  placeholder="选择行业"
                  size="large"
                  style="width: 100%"
                >
                  <el-option v-for="item in industryOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="使用场景 / 读者" prop="scenario">
                <el-input
                  v-model="form.scenario"
                  placeholder="如：投资人/战略部/销售支持"
                  size="large"
                />
              </el-form-item>
              
              <el-form-item label="研究目标" prop="objective" class="full-width">
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
                    <el-button type="primary" icon="Upload" size="large">
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
            
            <div class="form-actions">
              <el-button 
                type="primary" 
                size="large" 
                :loading="reportsStore.loading"
                @click="handleSubmit"
                icon="Sparkles"
                style="width: 100%"
              >
                {{ reportsStore.loading ? '生成大纲中...' : '生成大纲' }}
              </el-button>
              <el-button 
                size="large" 
                @click="resetForm"
                style="width: 100%"
              >
                重置
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- 使用说明 -->
        <div class="help-card">
          <h3><el-icon><QuestionFilled /></el-icon> 使用说明</h3>
          <div class="help-content">
            <div class="help-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>填写基本信息</h4>
                <p>输入报告标题、选择所属行业，并描述使用场景和研究目标</p>
              </div>
            </div>
            
            <div class="help-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>添加数据来源</h4>
                <p>输入数据来源，如招股书、财报、行业协会等，支持多个来源</p>
              </div>
            </div>
            
            <div class="help-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>AI智能生成大纲</h4>
                <p>系统将基于您的需求，使用AI技术自动生成报告大纲和亮点</p>
              </div>
            </div>
            
            <div class="help-item">
              <div class="step-number">4</div>
              <div class="step-content">
                <h4>进入工作台编辑</h4>
                <p>大纲生成后，进入工作台进行多轮对话优化和正文生成</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 支持的行业类型 -->
        <div class="support-card">
          <h3><el-icon><StarFilled /></el-icon> 支持的行业类型</h3>
          <div class="support-grid">
            <div class="support-item" v-for="industry in industryOptions" :key="industry">
              <el-icon size="24" color="#409eff"><TrendCharts /></el-icon>
              <div>
                <h4>{{ industry }}</h4>
                <p>产业报告分析</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近创建的报告 -->
        <div v-if="recentReports.length > 0" class="recent-card">
          <h3><el-icon><Clock /></el-icon> 最近创建的报告</h3>
          <div class="recent-list">
            <div 
              v-for="report in recentReports" 
              :key="report.id"
              class="recent-item"
              @click="$router.push(`/reports/${report.id}`)"
            >
              <div class="recent-content">
                <h4>{{ report.title || '未命名报告' }}</h4>
                <p>{{ report.industry }} · {{ report.scenario || '未指定场景' }}</p>
              </div>
              <div class="recent-status">
                <el-tag :type="getStatusType(report.status)" size="small">
                  {{ getStatusText(report.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useReportsStore } from '../stores/reports'

const router = useRouter()
const reportsStore = useReportsStore()

const formRef = ref()
const fileUploadRef = ref(null)
const uploadedFiles = ref([]) // 上传的文件列表
const form = reactive({
  title: '',
  industry: '',
  scenario: '',
  objective: ''
})

const industryOptions = ['AI/算力', '新能源', '半导体', 'SaaS', '制造业数字化', '医疗健康', '金融科技', '消费与零售', '出行与物流', '其他']

const recentReports = computed(() => 
  reportsStore.reports.slice(0, 5)
)

const rules = {
  title: [
    { required: true, message: '请输入报告标题', trigger: 'blur' }
  ],
  industry: [
    { required: true, message: '请选择所属行业', trigger: 'change' }
  ]
}

function getStatusType(status) {
  const statusMap = {
    draft: 'info',
    drafting: 'warning',
    generating: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

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
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    
    if (!form.title || !form.industry) {
      ElMessage.warning('请填写标题和行业')
      return
    }
    
    // 准备文件数据
    const files = uploadedFiles.value.map(f => f.file)
    
    const result = await reportsStore.createReport({ ...form }, files)
    
    if (result.success) {
      ElMessage.success('大纲生成完成，正在跳转到工作台...')
      resetForm()
      
      // 刷新报告列表
      await reportsStore.fetchReports()
      
      // 跳转到报告详情页
      router.push(`/reports/${result.reportId}`)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

onMounted(async () => {
  // 获取报告列表用于显示最近创建的报告
  await reportsStore.fetchReports()
})
</script>

<style scoped>
.add-article-container {
  min-height: 100vh;
  background: #f5f5f7;
  padding: 24px;
}

.add-header {
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
  margin: 0 0 8px 0;
  color: #1d1d1f;
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.page-title p {
  margin: 0;
  color: #86868b;
  font-size: 17px;
  font-weight: 400;
}

.add-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.url-form-card,
.help-card,
.support-card,
.recent-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  padding: 32px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 8px 24px rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.url-form-card::before,
.help-card::before,
.support-card::before,
.recent-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.02) 0%, transparent 50%);
  pointer-events: none;
}

.url-form-card:hover,
.help-card:hover,
.support-card:hover,
.recent-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15);
  border-color: var(--primary-color);
  background: rgba(248, 250, 255, 0.95);
}

.url-form-card h3,
.help-card h3,
.support-card h3,
.recent-card h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 24px 0;
  color: #1d1d1f;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  position: relative;
  z-index: 2;
}

.url-form-card h3 .el-icon,
.help-card h3 .el-icon,
.support-card h3 .el-icon,
.recent-card h3 .el-icon {
  width: 32px;
  height: 32px;
  background: rgba(142, 142, 147, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86868b;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  position: relative;
  z-index: 2;
}

.form-grid .full-width {
  grid-column: 1 / -1;
}

.data-source-upload {
  width: 100%;
}

.upload-tip {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 12px;
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
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: #eef2f7;
  border-color: #c0c4cc;
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
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.empty-hint {
  margin-top: 12px;
}

.hint-text {
  color: var(--text-muted);
  font-size: 12px;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  position: relative;
  z-index: 2;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 2;
}

.help-item {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-accent);
  transition: all var(--duration-normal) var(--ease-out);
}

.help-item:hover {
  background: rgba(99, 102, 241, 0.02);
  border-color: var(--primary-color);
  transform: translateX(4px);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #007AFF;
  color: white;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.step-content h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

.step-content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.6;
}

.support-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 2;
}

.support-item {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-accent);
  transition: all var(--duration-normal) var(--ease-out);
  cursor: pointer;
}

.support-item:hover {
  background: rgba(99, 102, 241, 0.03);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.support-item .el-icon {
  padding: 12px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  border-radius: 10px;
}

.support-item div h4 {
  margin: 0 0 4px 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.support-item div p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 2;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-accent);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
}

.recent-item:hover {
  background: rgba(99, 102, 241, 0.03);
  border-color: var(--primary-color);
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
}

.recent-content h4 {
  margin: 0 0 6px 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recent-content p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
}

/* 表单样式优化 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

:deep(.el-input__wrapper) {
  padding: 16px 20px;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal) var(--ease-out);
  background: var(--bg-primary);
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

:deep(.el-input__inner) {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

:deep(.el-input__inner::placeholder) {
  color: var(--text-light);
  font-weight: 400;
}

:deep(.el-select .el-input__wrapper) {
  cursor: pointer;
}

:deep(.el-textarea__inner) {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  padding: 16px 20px;
  transition: all var(--duration-normal) var(--ease-out);
}

:deep(.el-textarea__inner:hover) {
  border-color: var(--primary-color);
}

:deep(.el-textarea__inner:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

:deep(.el-button--primary) {
  height: 52px;
  border-radius: 18px;
  font-size: 17px;
  font-weight: 600;
  background: #007AFF !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3) !important;
  transition: all 0.2s ease !important;
}

:deep(.el-button--primary:hover) {
  background: #0051D5 !important;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4) !important;
  transform: translateY(-1px);
}

:deep(.el-tag) {
  padding: 8px 12px;
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 960px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-grid .full-width {
    grid-column: 1;
  }
}

@media (max-width: 768px) {
  .add-main {
    padding: 24px 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    text-align: center;
  }
  
  .url-form-card,
  .help-card,
  .support-card,
  .recent-card {
    padding: 24px 20px;
    border-radius: 16px;
  }
  
  .support-grid {
    grid-template-columns: 1fr;
  }
  
  .recent-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .help-item {
    padding: 16px;
  }
  
  .step-number {
    width: 36px;
    height: 36px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .form-container {
    gap: 24px;
  }
  
  .page-title h2 {
    font-size: 28px;
  }
  
  :deep(.el-button--primary) {
    height: 48px;
    font-size: 15px;
  }
}

/* 动画效果 */
.url-form-card {
  animation: slideInUp 0.6s ease-out;
}

.help-card {
  animation: slideInUp 0.6s ease-out 0.1s both;
}

.support-card {
  animation: slideInUp 0.6s ease-out 0.2s both;
}

.recent-card {
  animation: slideInUp 0.6s ease-out 0.3s both;
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
