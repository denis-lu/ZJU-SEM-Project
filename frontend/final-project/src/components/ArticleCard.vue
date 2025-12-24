<template>
  <div class="article-card interactive" @click="$emit('click')">
    <!-- 卡片背景装饰 -->
    <div class="card-background">
      <div class="bg-pattern"></div>
      <div class="gradient-overlay"></div>
    </div>
    
    <div class="card-header">
      <div class="article-title">
        <div class="title-icon">
          <el-icon><Document /></el-icon>
        </div>
        <h3>{{ article.title || '正在解析标题...' }}</h3>
      </div>
      <div class="article-status">
        <el-tag 
          :type="getStatusType(article.status)" 
          size="small"
          :icon="getStatusIcon(article.status)"
          class="modern-tag"
        >
          {{ getStatusText(article.status) }}
        </el-tag>
      </div>
    </div>
    
    <div class="card-body">
      <div class="article-url">
        <div class="url-icon">
          <el-icon><Link /></el-icon>
        </div>
        <span class="url-text">{{ truncateUrl(article.url) }}</span>
        <div class="url-indicator">
          <div class="secure-badge" v-if="article.url.startsWith('https')">
            <el-icon size="12"><Lock /></el-icon>
          </div>
        </div>
      </div>
      
      <div v-if="article.summary" class="article-summary">
        <div class="summary-label">
          <el-icon size="14"><Reading /></el-icon>
          <span>智能摘要</span>
        </div>
        <p>{{ truncateText(article.summary, 150) }}</p>
      </div>
      
      <div v-if="article.keywords && article.keywords.length > 0" class="article-keywords">
        <div class="keywords-label">
          <el-icon size="14"><PriceTag /></el-icon>
          <span>关键词</span>
        </div>
        <div class="keywords-list">
          <el-tag 
            v-for="keyword in article.keywords.slice(0, 5)" 
            :key="keyword"
            size="small"
            effect="plain"
            class="keyword-tag clickable"
            @click.stop="handleKeywordClick(keyword)"
          >
            {{ keyword }}
          </el-tag>
          <span v-if="article.keywords.length > 5" class="more-keywords">
            +{{ article.keywords.length - 5 }}个
          </span>
        </div>
      </div>
      
      <!-- 进度指示器 -->
      <div class="progress-section" v-if="['pending', 'processing'].includes(article.status)">
        <div class="progress-label">
          <el-icon size="14"><Loading /></el-icon>
          <span>{{ article.status === 'pending' ? '等待处理' : '正在分析' }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :class="{ active: article.status === 'processing' }"></div>
        </div>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="article-meta">
        <div class="meta-item">
          <div class="meta-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <span class="meta-text">{{ formatTime(article.created_at) }}</span>
        </div>
        <div v-if="article.conversations && article.conversations.length > 0" class="meta-item">
          <div class="meta-icon chat">
            <el-icon><ChatLineSquare /></el-icon>
          </div>
          <span class="meta-text">{{ article.conversations.length }} 问答</span>
        </div>
      </div>
      
      <div class="card-actions" @click.stop>
        <el-button 
          type="primary" 
          size="small" 
          icon="View"
          @click="$router.push(`/webpages/${article.id}`)"
          class="view-button"
        >
          查看详情
        </el-button>
        <el-dropdown @command="handleCommand" trigger="hover">
          <el-button size="small" icon="More" circle class="more-button" />
          <template #dropdown>
            <el-dropdown-menu class="modern-dropdown">
              <el-dropdown-item command="translate" :disabled="!article.content" class="dropdown-item">
                <el-icon><Switch /></el-icon>
                翻译摘要
              </el-dropdown-item>
              <el-dropdown-item command="export" :disabled="!article.content" class="dropdown-item">
                <el-icon><Download /></el-icon>
                导出网页
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided class="dropdown-item danger">
                <el-icon><Delete /></el-icon>
                删除网页
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { useArticlesStore } from '../stores/articles'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'keyword-click'])

const articlesStore = useArticlesStore()

function getStatusType(status) {
  const statusMap = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

function getStatusIcon(status) {
  const iconMap = {
    pending: 'Clock',
    processing: 'Loading',
    completed: 'Check',
    failed: 'Close'
  }
  return iconMap[status]
}

function getStatusText(status) {
  const textMap = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return textMap[status] || status
}

function truncateUrl(url) {
  if (url.length > 50) {
    return url.substring(0, 47) + '...'
  }
  return url
}

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...'
  }
  return text
}


async function handleCommand(command) {
  switch (command) {
    case 'translate':
      await handleTranslate()
      break
    case 'export':
      await handleExport()
      break
    case 'delete':
      await handleDelete()
      break
  }
}


function getLanguageName(lang) {
  const langMap = {
    'en': '英文',
    'zh': '中文', 
    'ja': '日文',
    'ko': '韩文',
    'fr': '法文',
    'de': '德文',
    'es': '西班牙文'
  }
  return langMap[lang] || lang
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN')
}

// 处理关键词点击事件
function handleKeywordClick(keyword) {
  emit('keyword-click', keyword)
}

async function handleTranslate() {
  try {
    const languageOptions = [
      { label: '英文', value: 'en' },
      { label: '日文', value: 'ja' },
      { label: '韩文', value: 'ko' },
      { label: '法文', value: 'fr' },
      { label: '德文', value: 'de' },
      { label: '西班牙文', value: 'es' },
      { label: '中文', value: 'zh' }
    ]
    
    // 使用Promise包装的对话框
    const selectedLanguage = await new Promise((resolve, reject) => {
      let selectedValue = 'en'
      
      // 创建选项HTML
      const optionsHtml = languageOptions.map(opt => 
        `<option value="${opt.value}">${opt.label}</option>`
      ).join('')
      
      ElMessageBox({
        title: '翻译摘要',
        message: `
          <div style="margin: 20px 0;">
            <p style="margin-bottom: 10px;">请选择目标语言：</p>
            <select id="language-select" style="width: 100%; padding: 8px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px;">
              ${optionsHtml}
            </select>
          </div>
        `,
        dangerouslyUseHTMLString: true,
        confirmButtonText: '开始翻译',
        cancelButtonText: '取消',
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            const select = document.getElementById('language-select')
            if (select) {
              selectedValue = select.value
            }
            resolve(selectedValue)
          } else {
            reject('cancelled')
          }
          done()
        }
      }).catch(() => {
        reject('cancelled')
      })
    })
    
    const result = await articlesStore.translateArticle(props.article.id, selectedLanguage)
    
    if (result.success) {
      ElMessage({
        message: `翻译完成！`,
        type: 'success',
        duration: 3000,
        showClose: true
      })
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消操作
  }
}

async function handleExport() {
  if (!props.article) return
  
  const content = `
# ${props.article.title || '未知标题'}

**原始链接**: ${props.article.url}
**添加时间**: ${formatTime(props.article.created_at)}
**处理状态**: ${getStatusText(props.article.status)}

${props.article.summary ? `## 摘要\n${props.article.summary}\n` : ''}

${props.article.keywords?.length ? `## 关键词\n${props.article.keywords.join(', ')}\n` : ''}

${props.article.translation ? `## 翻译 (${getLanguageName(props.article.language)})\n${props.article.translation}\n` : ''}

${props.article.content ? `## 原文内容\n${props.article.content}` : ''}
  `.trim()
  
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.article.title || 'article'}.md`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('网页已导出')
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定要删除这个网页吗？此操作不可恢复。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await articlesStore.deleteArticle(props.article.id)
    
    if (result.success) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消操作
  }
}
</script>

<style scoped>
.article-card {
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 0;
  border: 1px solid var(--border-accent);
  transition: all var(--duration-normal) var(--ease-out);
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.08);
}

.article-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, 
    var(--primary-color) 0%, 
    var(--primary-light) 50%, 
    var(--primary-color) 100%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.article-card:hover::before {
  transform: translateX(0);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15);
  border-color: var(--primary-color);
  background: rgba(248, 250, 255, 0.95);
}


/* 卡片背景效果 */
.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.03;
  pointer-events: none;
}

.bg-pattern {
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at 2px 2px, var(--primary-color) 1px, transparent 0);
  background-size: 24px 24px;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.02) 0%, 
    rgba(139, 92, 246, 0.02) 100%);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 0;
  margin-bottom: 16px;
  position: relative;
  z-index: 2;
}

.article-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  margin-right: 16px;
}

.title-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.1), 
    rgba(139, 92, 246, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
  transition: all var(--duration-normal) var(--ease-out);
}

.article-card:hover .title-icon {
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.15), 
    rgba(139, 92, 246, 0.15));
  transform: scale(1.05);
}

.article-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modern-tag {
  border-radius: 8px !important;
  border: none !important;
  font-weight: 500 !important;
  box-shadow: var(--shadow-sm) !important;
}

/* 卡片主体 */
.card-body {
  flex: 1;
  padding: 0 24px;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}

.article-url {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--border-accent);
}

.url-icon {
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.url-text {
  flex: 1;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-family-mono);
  word-break: break-all;
}

.url-indicator {
  display: flex;
  align-items: center;
}

.secure-badge {
  color: var(--success-color);
  display: flex;
  align-items: center;
}

.article-summary {
  margin-bottom: 16px;
}

.summary-label,
.keywords-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.article-summary p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-keywords {
  margin-bottom: 16px;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.keyword-tag {
  border-radius: 6px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  background: rgba(99, 102, 241, 0.08) !important;
  color: var(--primary-color) !important;
  border: 1px solid rgba(99, 102, 241, 0.2) !important;
}

.keyword-tag.clickable {
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.keyword-tag.clickable:hover {
  background: rgba(99, 102, 241, 0.15) !important;
  border-color: rgba(99, 102, 241, 0.4) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2) !important;
}

.more-keywords {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  background: var(--gray-100);
  padding: 2px 8px;
  border-radius: 6px;
}

/* 进度指示器 */
.progress-section {
  margin-top: 16px;
}

.progress-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.progress-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  border-radius: 2px;
  transition: width 0.3s ease;
  width: 30%;
}

.progress-fill.active {
  width: 70%;
  animation: pulse-progress 2s ease-in-out infinite;
}

@keyframes pulse-progress {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid var(--border-accent);
  background: var(--bg-tertiary);
  position: relative;
  z-index: 2;
}

.article-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 12px;
}

.meta-icon.chat {
  background: rgba(139, 92, 246, 0.1);
  color: var(--primary-light);
}

.meta-text {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-button {
  border-radius: 8px !important;
  font-weight: 600 !important;
  box-shadow: var(--shadow-sm) !important;
}

.more-button {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-accent) !important;
  color: var(--text-muted) !important;
  backdrop-filter: blur(10px) !important;
}

.more-button:hover {
  background: var(--primary-color) !important;
  color: white !important;
  border-color: var(--primary-color) !important;
}


/* 下拉菜单样式 */
:deep(.modern-dropdown) {
  border-radius: 12px !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: var(--shadow-lg) !important;
  padding: 8px !important;
}

:deep(.dropdown-item) {
  border-radius: 8px !important;
  margin: 2px 0 !important;
  padding: 8px 12px !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  transition: all var(--duration-fast) var(--ease-out) !important;
}

:deep(.dropdown-item:hover) {
  background: var(--bg-secondary) !important;
  color: var(--primary-color) !important;
}

:deep(.dropdown-item.danger:hover) {
  background: rgba(239, 68, 68, 0.1) !important;
  color: var(--error-color) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .article-card {
    border-radius: 12px;
  }
  
  .card-header,
  .card-body {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .card-footer {
    padding: 16px;
  }
  
  .article-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 8px;
  }
  
}
</style>
