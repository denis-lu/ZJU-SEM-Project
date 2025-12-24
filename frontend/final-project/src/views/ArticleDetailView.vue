<template>
  <div class="article-detail-container">
    <!-- 顶部导航 -->
    <header class="detail-header">
      <div class="header-content">
        <el-button @click="$router.push('/webpages')" icon="ArrowLeft">返回网页列表</el-button>
        <div class="header-actions">
          <el-dropdown @command="handleCommand">
            <el-button icon="More">更多操作</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="translate" :disabled="!article?.summary">
                  <el-icon><Switch /></el-icon>
                  翻译摘要
                </el-dropdown-item>
                <el-dropdown-item command="export">
                  <el-icon><Download /></el-icon>
                  导出网页
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  删除网页
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="detail-main" v-if="article">
      <div class="content-grid">
        <!-- 左侧：文章内容 -->
        <div class="article-content">
          <!-- 面包屑导航 -->
          <div class="breadcrumb-nav">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>
                  <el-button 
                  type="text" 
                  @click="$router.push('/webpages')"
                  class="breadcrumb-link"
                >
                  <el-icon><House /></el-icon>
                  网页列表
                </el-button>
              </el-breadcrumb-item>
              <el-breadcrumb-item>网页详情</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="article-header">
            <h1>{{ article.title || '正在解析标题...' }}</h1>
            <div class="article-meta">
              <el-tag :type="getStatusType(article.status)" :icon="getStatusIcon(article.status)">
                {{ getStatusText(article.status) }}
              </el-tag>
              <el-tag v-if="isPolling" type="info" size="small">
                <el-icon class="is-loading"><Loading /></el-icon>
                自动刷新中...
              </el-tag>
              <span class="url-info">
                <el-icon><Link /></el-icon>
                <a :href="article.url" target="_blank" rel="noopener">{{ article.url }}</a>
              </span>
              <span class="time-info">
                <el-icon><Clock /></el-icon>
                {{ formatTime(article.created_at) }}
              </span>
            </div>
          </div>

          <!-- 网页摘要 -->
          <div v-if="article.summary" class="content-section">
            <h3><el-icon><Document /></el-icon> 网页摘要</h3>
            <div class="summary-content">{{ article.summary }}</div>
            <!-- 摘要翻译 -->
            <div v-if="article.translation" class="translation-section">
              <h4><el-icon><Switch /></el-icon> 摘要翻译 ({{ getLanguageName(article.language) }})</h4>
              <div class="translation-content">{{ article.translation }}</div>
            </div>
          </div>

          <!-- 关键词 -->
          <div v-if="article.keywords && article.keywords.length > 0" class="content-section">
            <h3><el-icon><Collection /></el-icon> 关键词</h3>
            <div class="keywords-content">
              <el-tag 
                v-for="keyword in article.keywords" 
                :key="keyword"
                effect="plain"
                style="margin: 0 8px 8px 0"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </div>


          <!-- 原文内容 -->
          <div v-if="article.content" class="content-section">
            <h3><el-icon><Reading /></el-icon> 原文内容</h3>
            <div class="original-content markdown-content" v-html="renderedContent"></div>
          </div>
        </div>

        <!-- 右侧：问答区域 -->
        <div class="chat-panel">
          <div class="chat-header">
            <h3><el-icon><ChatLineSquare /></el-icon> 智能问答</h3>
            <p>基于网页内容进行问答交流</p>
          </div>

          <!-- 聊天记录 -->
          <div class="chat-messages" ref="messagesContainer">
            <div 
              v-for="(conversation, index) in chatHistory" 
              :key="index"
              class="message-group"
            >
              <div class="user-message">
                <div class="message-content">{{ conversation.question }}</div>
                <div class="message-time">{{ formatTime(conversation.created_at) }}</div>
              </div>
              <div class="ai-message">
                <div v-if="conversation.status === 'pending'" class="message-content pending-message">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  AI正在思考中...
                </div>
                <div v-else-if="conversation.status === 'failed'" class="message-content error-message">
                  <el-icon><Warning /></el-icon>
                  回答失败，请重试
                </div>
                <div v-else-if="conversation.status === 'timeout'" class="message-content error-message">
                  <el-icon><Clock /></el-icon>
                  回答超时，请重试
                </div>
                <div v-else class="message-content">{{ conversation.answer }}</div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="chat-input">
            <el-input
              v-model="newQuestion"
              :disabled="!article.content || askLoading"
              placeholder="请输入您的问题..."
              @keydown.enter="handleAsk"
            >
              <template #append>
                <el-button 
                  @click="handleAsk" 
                  :loading="askLoading"
                  :disabled="!newQuestion.trim() || !article.content"
                  type="primary"
                  icon="Position"
                >
                  发送
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </main>

    <!-- 加载状态 -->
    <div v-else-if="articlesStore.loading" class="loading-container">
      <el-loading-spinner size="large" />
      <p>加载网页详情中...</p>
    </div>

    <!-- 错误状态 -->
    <el-empty v-else description="网页不存在或加载失败" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useArticlesStore } from '../stores/articles'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()
const articlesStore = useArticlesStore()

const newQuestion = ref('')
const askLoading = ref(false)
const loading = ref(false)
const messagesContainer = ref()
const refreshTimer = ref(null)
const isPolling = ref(false)
const qaPollingTimers = ref(new Map())
const localChatHistory = ref([])

const article = computed(() => articlesStore.currentArticle)
const chatHistory = computed(() => {
  // 合并服务器数据和本地数据
  const serverConversations = article.value?.conversations || []
  const localConversations = localChatHistory.value || []
  
  // 创建一个Map来去重，优先使用本地数据（因为本地数据可能包含pending状态）
  const conversationMap = new Map()
  
  // 先添加服务器数据
  serverConversations.forEach(conv => {
    conversationMap.set(conv.id, conv)
  })
  
  // 再添加本地数据，覆盖服务器数据
  localConversations.forEach(conv => {
    conversationMap.set(conv.id, conv)
  })
  
  return Array.from(conversationMap.values()).sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  )
})

// 将markdown内容转换为HTML
const renderedContent = computed(() => {
  if (!article.value?.content) return ''
  try {
    const html = marked(article.value.content)
    
    // 使用nextTick确保DOM更新后处理图片
    nextTick(() => {
      processImagesInContent()
    })
    
    return html
  } catch (error) {
    console.error('Markdown解析错误:', error)
    return article.value.content
  }
})

// 处理内容中的图片，确保它们不会撑大容器
function processImagesInContent() {
  const container = document.querySelector('.original-content')
  if (!container) {
    console.log('未找到 .original-content 容器')
    return
  }
  
  console.log('开始处理内容中的媒体元素...')
  
  const images = container.querySelectorAll('img')
  console.log(`找到 ${images.length} 张图片`)
  
  images.forEach((img, index) => {
    const originalWidth = img.offsetWidth
    const originalSrc = img.src
    
    // 移除可能的内联样式宽度设置
    img.style.maxWidth = '100%'
    img.style.width = 'auto'
    img.style.height = 'auto'
    
    // 如果图片有固定宽度属性，也要处理
    if (img.hasAttribute('width')) {
      console.log(`图片 ${index + 1} 移除 width 属性:`, img.getAttribute('width'))
      img.removeAttribute('width')
    }
    if (img.hasAttribute('height')) {
      console.log(`图片 ${index + 1} 移除 height 属性:`, img.getAttribute('height'))
      img.removeAttribute('height')
    }
    
    console.log(`图片 ${index + 1} 处理完成:`, {
      src: originalSrc.substring(0, 50) + '...',
      originalWidth,
      newWidth: img.offsetWidth
    })
  })
  
  // 处理其他可能撑大容器的元素
  const mediaElements = container.querySelectorAll('video, iframe, embed, object')
  console.log(`找到 ${mediaElements.length} 个其他媒体元素`)
  
  mediaElements.forEach((element, index) => {
    element.style.maxWidth = '100%'
    element.style.width = 'auto'
    element.style.height = 'auto'
    console.log(`媒体元素 ${index + 1} (${element.tagName}) 已处理`)
  })
  
  // 检查容器的滚动宽度
  console.log('容器信息:', {
    clientWidth: container.clientWidth,
    scrollWidth: container.scrollWidth,
    offsetWidth: container.offsetWidth
  })
  
  if (container.scrollWidth > container.clientWidth) {
    console.warn('⚠️ 容器仍然被撑大了！scrollWidth > clientWidth')
    
    // 查找可能导致溢出的元素
    const allElements = container.querySelectorAll('*')
    allElements.forEach(el => {
      if (el.scrollWidth > container.clientWidth) {
        console.warn('发现可能导致溢出的元素:', {
          tagName: el.tagName,
          className: el.className,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth
        })
      }
    })
  } else {
    console.log('✅ 容器大小正常')
  }
}

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

// 开始轮询检查网页状态
function startPolling() {
  if (refreshTimer.value || !article.value) return
  
  const articleId = article.value.id
  const currentStatus = article.value.status
  
  // 只有在处理中状态时才轮询
  if (currentStatus === 'processing' || currentStatus === 'pending') {
    isPolling.value = true
    refreshTimer.value = setInterval(async () => {
      try {
        const result = await articlesStore.refreshArticleDetail(articleId)
        if (result.success) {
          const newStatus = result.data.status
          const oldStatus = article.value?.status
          
          // 如果状态发生变化，显示提示
          if (newStatus !== oldStatus) {
            if (newStatus === 'completed') {
              ElMessage.success('网页处理完成！')
              stopPolling()
            } else if (newStatus === 'failed') {
              ElMessage.error('网页处理失败')
              stopPolling()
            }
          }
        }
      } catch (error) {
        console.warn('轮询检查失败:', error)
        // 如果连续失败，停止轮询
        stopPolling()
      }
    }, 3000) // 每3秒检查一次
  }
}

// 停止轮询
function stopPolling() {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
    isPolling.value = false
  }
}

// 开始问答轮询
function startQAPolling(conversationId) {
  if (qaPollingTimers.value.has(conversationId)) return
  
  let pollCount = 0
  const maxPolls = 150 // 最多轮询30次（1分钟）
  
  const timer = setInterval(async () => {
    pollCount++
    
    try {
      const result = await articlesStore.fetchConversationDetail(conversationId)
      console.log(`轮询对话 ${conversationId}:`, result)
      
      if (result.success) {
        const conversation = result.data
        console.log(`对话数据:`, conversation)
        
        // 更新本地聊天历史中的对话
        const index = localChatHistory.value.findIndex(c => c.id === conversationId)
        if (index !== -1) {
          localChatHistory.value[index] = {
            ...localChatHistory.value[index],
            answer: conversation.answer,
            status: conversation.status,
            answered_at: conversation.answered_at
          }
          
          // 如果回答完成，停止轮询并滚动到底部
          if (conversation.status === 'completed' && conversation.answer) {
            stopQAPolling(conversationId)
            await nextTick()
            if (messagesContainer.value) {
              messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
            }
            ElMessage.success('AI已回答您的问题！')
          } else if (conversation.status === 'failed') {
            stopQAPolling(conversationId)
            ElMessage.error('AI回答失败，请重试')
          }
        }
      }
      
      // 超时处理
      if (pollCount >= maxPolls) {
        stopQAPolling(conversationId)
        const index = localChatHistory.value.findIndex(c => c.id === conversationId)
        if (index !== -1) {
          localChatHistory.value[index].status = 'timeout'
        }
        ElMessage.warning('AI回答超时，请重试')
      }
    } catch (error) {
      console.warn('问答轮询失败:', error)
      
      // 如果是网络错误或临时错误，不立即停止轮询，给几次重试机会
      if (pollCount < 5) {
        console.log(`轮询失败，将在下次继续重试 (${pollCount}/${maxPolls})`)
        return // 继续轮询
      }
      
      // 多次失败后才停止轮询
      stopQAPolling(conversationId)
      const index = localChatHistory.value.findIndex(c => c.id === conversationId)
      if (index !== -1) {
        localChatHistory.value[index].status = 'failed'
      }
      ElMessage.error('获取回答失败，请重试')
    }
  }, 2000) // 每2秒检查一次
  
  qaPollingTimers.value.set(conversationId, timer)
}

// 停止问答轮询
function stopQAPolling(conversationId) {
  const timer = qaPollingTimers.value.get(conversationId)
  if (timer) {
    clearInterval(timer)
    qaPollingTimers.value.delete(conversationId)
  }
}

// 停止所有问答轮询
function stopAllQAPolling() {
  qaPollingTimers.value.forEach((timer, conversationId) => {
    clearInterval(timer)
  })
  qaPollingTimers.value.clear()
}

// 监听网页状态变化
watch(() => article.value?.status, (newStatus, oldStatus) => {
  if (newStatus && newStatus !== oldStatus) {
    if (newStatus === 'processing' || newStatus === 'pending') {
      startPolling()
    } else if (newStatus === 'completed' || newStatus === 'failed') {
      stopPolling()
    }
  }
}, { immediate: true })

async function handleAsk() {
  if (!newQuestion.value.trim() || !article.value?.content) return
  
  askLoading.value = true
  try {
    const result = await articlesStore.askQuestion(article.value.id, newQuestion.value)
    
    if (result.success) {
      const question = newQuestion.value
      newQuestion.value = ''
      
      // 添加到本地聊天历史（初始状态为pending）
      const newConversation = {
        id: result.data.conversationId,
        question: question,
        answer: null,
        status: 'pending',
        created_at: new Date().toISOString()
      }
      
      localChatHistory.value.push(newConversation)
      
      // 滚动到底部
      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
      
      // 开始轮询检查问答结果
      startQAPolling(result.data.conversationId)
      
      ElMessage.success('问题已提交，AI正在思考中...')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('问答失败')
  } finally {
    askLoading.value = false
  }
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
    
    const result = await articlesStore.translateArticle(article.value.id, selectedLanguage)
    
    if (result.success) {
      ElMessage({
        message: '翻译完成！',
        type: 'success',
        duration: 3000,
        showClose: true
      })
      // 重新获取文章详情以显示翻译内容
      await articlesStore.fetchArticleDetail(article.value.id)
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消操作
  }
}

async function handleExport() {
  if (!article.value) return
  
  const content = `
# ${article.value.title || '未知标题'}

**原始链接**: ${article.value.url}
**添加时间**: ${formatTime(article.value.created_at)}
**处理状态**: ${getStatusText(article.value.status)}

${article.value.summary ? `## 摘要\n${article.value.summary}\n` : ''}

${article.value.keywords?.length ? `## 关键词\n${article.value.keywords.join(', ')}\n` : ''}

${article.value.translation ? `## 翻译 (${getLanguageName(article.value.language)})\n${article.value.translation}\n` : ''}

${article.value.content ? `## 原文内容\n${article.value.content}` : ''}
  `.trim()
  
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${article.value.title || 'article'}.md`
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
    
    const result = await articlesStore.deleteArticle(article.value.id)
    
    if (result.success) {
      ElMessage.success(result.message)
      router.push('/webpages')
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消操作
  }
}

onMounted(async () => {
  const articleId = route.params.id
  await articlesStore.fetchArticleDetail(articleId)
  
  // 如果网页正在处理中，开始轮询
  if (article.value?.status === 'processing' || article.value?.status === 'pending') {
    startPolling()
  }
  
  // 处理内容中的图片
  await nextTick()
  processImagesInContent()
})

onUnmounted(() => {
  // 组件卸载时停止所有轮询
  stopPolling()
  stopAllQAPolling()
})
</script>

<style scoped>
.article-detail-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.detail-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.detail-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  width: 100%;
  min-width: 0; /* 允许网格项目收缩 */
}

.article-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 0; /* 允许内容收缩 */
  overflow: hidden; /* 防止内容溢出 */
}

.breadcrumb-nav {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.breadcrumb-link {
  padding: 0;
  height: auto;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-link:hover {
  color: #66b1ff;
}

.article-header h1 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 28px;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.url-info, .time-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 14px;
}

.url-info a {
  color: #409eff;
  text-decoration: none;
}

.content-section {
  margin-bottom: 32px;
}

.content-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 18px;
}

.summary-content {
  background: #f8f9fb;
  border-radius: 6px;
  padding: 16px;
  line-height: 1.8;
  color: #606266;
  margin-bottom: 16px;
}

.translation-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.translation-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  color: #409eff;
  font-size: 16px;
  font-weight: 600;
}

.translation-content {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  padding: 16px;
  line-height: 1.8;
  color: #1890ff;
}

.keywords-content {
  display: flex;
  flex-wrap: wrap;
}

.original-content {
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 20px;
  line-height: 1.8;
  color: #606266;
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden !important; /* 防止水平溢出 */
  word-wrap: break-word; /* 长单词换行 */
  word-break: break-all; /* 强制换行 */
  width: 100%;
  box-sizing: border-box;
}

/* 专门针对原文内容中的图片 - 使用更具体的选择器 */
.article-content .original-content img,
.original-content.markdown-content img {
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
  display: block;
  margin: 16px auto;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 原文内容中的所有媒体元素 */
.original-content video,
.original-content iframe,
.original-content embed,
.original-content object {
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
}

/* 原文内容中的表格 */
.original-content table {
  width: 100% !important;
  max-width: 100% !important;
  table-layout: fixed;
  word-wrap: break-word;
}

/* 强制所有子元素不超出容器 */
.original-content * {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 特别处理可能很宽的元素 */
.original-content pre,
.original-content code {
  max-width: 100% !important;
  overflow-x: auto !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
}

/* 处理内联样式可能设置的固定宽度 */
.original-content [style*="width"] {
  width: auto !important;
  max-width: 100% !important;
}

/* Markdown 内容样式 */
.markdown-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.markdown-content h1, 
.markdown-content h2, 
.markdown-content h3, 
.markdown-content h4, 
.markdown-content h5, 
.markdown-content h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #303133;
}

.markdown-content h1 {
  font-size: 2em;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 0.3em;
}

.markdown-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 0.3em;
}

.markdown-content h3 {
  font-size: 1.25em;
}

.markdown-content p {
  margin-bottom: 16px;
  line-height: 1.6;
}

.markdown-content code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: #f6f8fa;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}

.markdown-content pre code {
  display: inline;
  max-width: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}

.markdown-content blockquote {
  padding: 0 1em;
  color: #656d76;
  border-left: 0.25em solid #d0d7de;
  margin-bottom: 16px;
}

.markdown-content ul, 
.markdown-content ol {
  padding-left: 2em;
  margin-bottom: 16px;
}

.markdown-content li {
  margin-bottom: 0.25em;
}

.markdown-content table {
  border-spacing: 0;
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.markdown-content th, 
.markdown-content td {
  padding: 6px 13px;
  border: 1px solid #d0d7de;
}

.markdown-content th {
  font-weight: 600;
  background-color: #f6f8fa;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content strong {
  font-weight: 600;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.markdown-content img:hover {
  transform: scale(1.02);
}

/* 处理其他可能撑大容器的元素 */
.markdown-content video {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 16px 0;
}

.markdown-content iframe {
  max-width: 100%;
  border-radius: 6px;
  margin: 16px 0;
}

.markdown-content svg {
  max-width: 100%;
  height: auto;
}

/* 防止长链接撑大容器 */
.markdown-content a {
  color: #0969da;
  text-decoration: none;
  word-break: break-all;
}

/* 防止代码块撑大容器 */
.markdown-content pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
  margin-bottom: 16px;
  max-width: 100%;
  white-space: pre-wrap; /* 保持空格但允许换行 */
  word-wrap: break-word;
}

.chat-panel {
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: fit-content;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-header {
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #e4e7ed;
}

.chat-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  color: #303133;
}

.chat-header p {
  margin: 0 0 16px 0;
  color: #909399;
  font-size: 14px;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.message-group {
  margin-bottom: 20px;
}

.user-message {
  text-align: right;
  margin-bottom: 8px;
}

.user-message .message-content {
  display: inline-block;
  background: #409eff;
  color: white;
  padding: 8px 12px;
  border-radius: 18px;
  max-width: 80%;
  word-break: break-word;
}

.user-message .message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.ai-message .message-content {
  display: inline-block;
  background: #f0f2f5;
  color: #303133;
  padding: 8px 12px;
  border-radius: 18px;
  max-width: 80%;
  word-break: break-word;
  line-height: 1.6;
}

.pending-message {
  background: #e6f7ff !important;
  color: #1890ff !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-message {
  background: #fff2f0 !important;
  color: #ff4d4f !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #909399;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .chat-panel {
    order: -1;
  }
}
</style>
