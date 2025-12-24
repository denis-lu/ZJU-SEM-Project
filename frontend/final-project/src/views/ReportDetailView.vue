<template>
  <div class="detail-container" v-if="report">
    <header class="detail-header glass-effect">
      <div>
        <p class="eyebrow">报告工作台</p>
        <h2>{{ report.title }}</h2>
        <p class="muted">{{ report.industry }} · {{ report.scenario || '未指定场景' }}</p>
      </div>
      <div class="header-actions">
        <el-tag :type="getStatusType(report.status)">{{ statusText(report.status) }}</el-tag>
        <el-button size="small" icon="Refresh" @click="refresh">刷新</el-button>
        <el-button
          type="primary"
          size="small"
          :loading="reportsStore.loading && report.status !== 'completed'"
          @click="handleGenerate"
        >
          {{ report.status === 'completed' ? '重新生成' : '生成正文' }}
        </el-button>
      </div>
    </header>

    <main class="content">
      <section class="left glass-effect">
        <div class="block">
          <div class="block-header">
          <h3>大纲与亮点</h3>
            <div class="block-actions">
              <el-button
                v-if="!isEditingOutline"
                size="small"
                type="primary"
                text
                icon="Edit"
                @click="startEditOutline"
              >
                编辑
              </el-button>
              <template v-else>
                <el-button size="small" @click="cancelEditOutline">取消</el-button>
                <el-button
                  size="small"
                  type="primary"
                  :loading="savingOutline"
                  @click="saveOutline"
                >
                  保存
                </el-button>
              </template>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-if="isEditingOutline" class="outline-editor">
            <div
              v-for="(item, idx) in editingOutline"
              :key="idx"
              class="outline-item-editor"
              :style="{ marginLeft: `${(item.level - 1) * 20}px` }"
            >
              <div class="outline-item-header">
                <div class="outline-level-badge">L{{ item.level || 1 }}</div>
                <el-input
                  :model-value="item.title"
                  @update:model-value="(val) => updateOutlineItem([idx], { title: val })"
                  :placeholder="`请输入第${item.level || 1}级标题`"
                  class="outline-title-input"
                />
                <div class="outline-actions">
                  <el-button
                    size="small"
                    text
                    type="primary"
                    icon="Plus"
                    @click="addChildItem([idx])"
                  >
                    子标题
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    text
                    icon="Delete"
                    @click="removeOutlineItem([idx])"
                  />
                </div>
              </div>
              <!-- 递归渲染子项 -->
              <template v-if="item.children && item.children.length > 0">
                <div
                  v-for="(child, cIdx) in item.children"
                  :key="cIdx"
                  class="outline-item-editor"
                  :style="{ marginLeft: `${(child.level - 1) * 20}px` }"
                >
                  <div class="outline-item-header">
                    <div class="outline-level-badge">L{{ child.level || 2 }}</div>
                    <el-input
                      :model-value="child.title"
                      @update:model-value="(val) => updateOutlineItem([idx, cIdx], { title: val })"
                      :placeholder="`请输入第${child.level || 2}级标题`"
                      class="outline-title-input"
                    />
                    <div class="outline-actions">
                      <el-button
                        size="small"
                        text
                        type="primary"
                        icon="Plus"
                        @click="addChildItem([idx, cIdx])"
                      >
                        子标题
                      </el-button>
                      <el-button
                        type="danger"
                        size="small"
                        text
                        icon="Delete"
                        @click="removeOutlineItem([idx, cIdx])"
                      />
                    </div>
                  </div>
                  <!-- 三级标题 -->
                  <template v-if="child.children && child.children.length > 0">
                    <div
                      v-for="(grandchild, gIdx) in child.children"
                      :key="gIdx"
                      class="outline-item-editor"
                      :style="{ marginLeft: `${(grandchild.level - 1) * 20}px` }"
                    >
                      <div class="outline-item-header">
                        <div class="outline-level-badge">L{{ grandchild.level || 3 }}</div>
                        <el-input
                          :model-value="grandchild.title"
                          @update:model-value="(val) => updateOutlineItem([idx, cIdx, gIdx], { title: val })"
                          :placeholder="`请输入第${grandchild.level || 3}级标题`"
                          class="outline-title-input"
                        />
                        <div class="outline-actions">
                          <el-button
                            size="small"
                            text
                            type="primary"
                            icon="Plus"
                            @click="addChildItem([idx, cIdx, gIdx])"
                          >
                            子标题
                          </el-button>
                          <el-button
                            type="danger"
                            size="small"
                            text
                            icon="Delete"
                            @click="removeOutlineItem([idx, cIdx, gIdx])"
                          />
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </template>
            </div>
            <el-button
              size="small"
              text
              type="primary"
              icon="Plus"
              @click="addOutlineItem"
              style="width: 100%; margin-top: 12px"
            >
              添加一级标题
            </el-button>
          </div>

          <!-- 查看模式 -->
          <template v-else>
            <div v-if="report.outline?.length" class="outline-view">
              <div
                v-for="(item, idx) in normalizedOutline"
                :key="idx"
                class="outline-item-view"
              >
                <div
                  :class="`outline-title level-${item.level || 1}`"
                  :style="{ marginLeft: `${((item.level || 1) - 1) * 20}px` }"
                >
                  {{ item.title }}
                </div>
                <!-- 递归渲染子项 -->
                <template v-if="item.children && item.children.length > 0">
                  <div
                    v-for="(child, cIdx) in item.children"
                    :key="cIdx"
                    class="outline-item-view"
                  >
                    <div
                      :class="`outline-title level-${child.level || 2}`"
                      :style="{ marginLeft: `${((child.level || 2) - 1) * 20}px` }"
                    >
                      {{ child.title }}
                    </div>
                    <!-- 三级标题 -->
                    <template v-if="child.children && child.children.length > 0">
                      <div
                        v-for="(grandchild, gIdx) in child.children"
                        :key="gIdx"
                        class="outline-item-view"
                      >
                        <div
                          :class="`outline-title level-${grandchild.level || 3}`"
                          :style="{ marginLeft: `${((grandchild.level || 3) - 1) * 20}px` }"
                        >
                          {{ grandchild.title }}
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
                <!-- 兼容旧格式：bullets -->
                <ul v-else-if="item.bullets && item.bullets.length > 0" class="bullets">
                  <li v-for="(bullet, bIdx) in item.bullets" :key="bIdx">{{ bullet }}</li>
              </ul>
              </div>
            </div>
          <el-empty v-else description="尚未生成大纲" />
          </template>
        </div>

        <div class="block" v-if="uploadedFilesList.length > 0">
          <h3>数据来源</h3>
          <div class="file-sources">
            <div 
              v-for="(file, idx) in uploadedFilesList" 
              :key="idx"
              class="file-source-item"
            >
              <el-icon class="file-source-icon"><Document /></el-icon>
              <span class="file-source-name">{{ file.name }}</span>
              <span class="file-source-size">{{ formatFileSize(file.size) }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="right canvas-layout">
        <!-- Canvas 模式：报告和对话并排 -->
        <div class="canvas-container">
          <!-- 左侧：报告正文编辑器 -->
          <div class="canvas-report glass-effect" :data-mode="editorMode">
            <div class="report-toolbar">
              <div class="toolbar-left">
                <el-radio-group v-model="editorMode" size="small">
                  <el-radio-button label="edit">编辑</el-radio-button>
                  <el-radio-button label="preview">预览</el-radio-button>
                  <el-radio-button label="split">分屏</el-radio-button>
                </el-radio-group>
              </div>
              <div class="toolbar-actions">
                <el-button 
                  size="small" 
                  type="primary"
                  :loading="savingContent"
                  @click="saveContent"
                >
                  <el-icon><Check /></el-icon>
                  保存
                </el-button>
                <el-button size="small" text @click="handleExport">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </div>
            
            <div class="editor-wrapper" :class="`mode-${editorMode}`">
              <!-- 编辑器模式 -->
              <div v-if="editorMode === 'edit' || editorMode === 'split'" class="editor-container">
                <el-input
                  v-model="editingContent"
                  type="textarea"
                  :rows="20"
                  :autosize="{ minRows: 20, maxRows: 50 }"
                  placeholder="在此编辑 Markdown 内容..."
                  class="markdown-editor"
                  @select="handleEditorSelection"
                  ref="markdownEditor"
                />
              </div>
              
              <!-- 预览模式 -->
              <div 
                v-if="editorMode === 'preview' || editorMode === 'split'"
                class="preview-container"
                :class="{ 'split-preview': editorMode === 'split' }"
              >
                <div 
                  class="markdown-preview markdown" 
                  v-html="previewContent"
                  @mouseup="handleTextSelection"
                  @selectstart="handleSelectStart"
                  @click="handleCanvasClick"
                  ref="reportCanvas"
                ></div>
              </div>
            </div>
            
            <el-empty v-if="!report.content && editorMode === 'preview' && !editingContent" description="暂未生成正文，点击上方生成按钮开始" />
            
            <!-- 文本选择工具栏 -->
            <teleport to="body">
              <div 
                v-if="selectedText && selectionToolbarVisible"
                class="selection-toolbar"
                :style="toolbarPosition"
                @mousedown.stop
                @click.stop
              >
                <el-button 
                  size="small" 
                  type="primary"
                  @click.stop="handleQuickEdit"
                >
                  <el-icon><Edit /></el-icon>
                  快速编辑
                </el-button>
                <el-button 
                  size="small" 
                  @click.stop="clearSelection"
                >
                  取消
                </el-button>
              </div>
            </teleport>
          </div>

          <!-- 右侧：对话面板 -->
          <div class="canvas-chat glass-effect">
          <div class="chat-header">
              <h3>AI 助手</h3>
              <p class="muted">选中文本后可直接编辑</p>
          </div>
            
            <!-- 选中文本提示 -->
            <div v-if="selectedText" class="selected-context">
              <div class="context-header">
                <el-icon><Document /></el-icon>
                <span>已选中内容</span>
                <el-button size="small" text @click="clearSelection">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
              <div class="context-text">{{ selectedText }}</div>
            </div>
            
            <div class="messages-container" ref="messagesContainer" :style="{ maxHeight: selectedText ? 'calc(100vh - 400px)' : 'calc(100vh - 300px)' }">
              <div 
                v-for="msg in reportsStore.conversations" 
                :key="msg.id" 
                class="message-wrapper"
                :class="msg.role"
              >
                <div class="message-avatar" :class="`avatar-${msg.role}`">
                  <el-icon v-if="msg.role === 'assistant'"><ChatDotRound /></el-icon>
                  <el-icon v-else><User /></el-icon>
          </div>
                <div class="message-content">
                  <div class="message-bubble" :class="`bubble-${msg.role}`">
                    <div v-if="msg.pending" class="message-text pending-message">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      <span>{{ msg.message }}</span>
                    </div>
                    <div v-else class="message-text" v-html="formatMessage(msg.message)"></div>
                    <!-- 显示上传的文件 -->
                    <div v-if="msg.files && msg.files.length > 0" class="message-files">
                      <div 
                        v-for="(file, index) in msg.files" 
                        :key="index"
                        class="message-file-item"
                      >
                        <el-icon><Document /></el-icon>
                        <span>{{ file.name }}</span>
                        <span class="file-size-text">{{ formatFileSize(file.size) }}</span>
                      </div>
                    </div>
                    <div class="message-actions">
                      <div class="message-time">{{ formatDate(msg.created_at) }}</div>
                      <el-button 
                        v-if="msg.role === 'assistant' && msg.message && !msg.pending && msg.message !== '生成失败，请稍后重试'"
                        size="small"
                        text
                        type="primary"
                        @click="applyToReport(msg.message)"
                      >
                        <el-icon><Check /></el-icon>
                        应用到报告
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 空状态 -->
              <div v-if="reportsStore.conversations.length === 0" class="empty-chat">
                <el-icon class="empty-icon"><ChatLineRound /></el-icon>
                <p>选中报告中的文本，然后输入指令进行编辑</p>
                <p class="hint">例如："请补充更多数据" 或 "让这段更简洁"</p>
              </div>
            </div>
            
            <div class="chat-input-container">
              <!-- 文件预览区域 -->
              <div v-if="uploadedFiles.length > 0" class="uploaded-files-preview">
                <div 
                  v-for="(file, index) in uploadedFiles" 
                  :key="index"
                  class="file-preview-item"
                >
                  <div v-if="file.type.startsWith('image/')" class="image-preview">
                    <img :src="file.preview" :alt="file.name" />
                    <div class="file-info">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                    <el-button 
                      size="small" 
                      text 
                      type="danger"
                      @click="removeFile(index)"
                      class="remove-file-btn"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                  <div v-else class="file-preview">
                    <el-icon class="file-icon"><Document /></el-icon>
                    <div class="file-info">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                    <el-button 
                      size="small" 
                      text 
                      type="danger"
                      @click="removeFile(index)"
                      class="remove-file-btn"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
              
              <div class="input-wrapper-dark">
                <el-upload
                  ref="fileUploadRef"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleFileChange"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                  multiple
                  class="upload-trigger"
                >
                  <template #trigger>
                    <button type="button" class="attach-button" :disabled="reportsStore.loading">
                      <el-icon><Plus /></el-icon>
                    </button>
                  </template>
                </el-upload>
                
            <el-input
              v-model="chatInput"
                  type="textarea"
                  :rows="1"
                  :autosize="{ minRows: 1, maxRows: 6 }"
              :disabled="reportsStore.loading"
                  :placeholder="selectedText ? '输入编辑指令...' : '输入问题或指令，例如：请补充市场容量数据'"
                  @keydown.enter.exact.prevent="handleSend"
                  @keydown.shift.enter.exact="handleNewLine"
                  class="chat-textarea-dark"
                />
                
                <div class="input-actions-right">
                  <button 
                    type="button"
                    class="send-button-dark"
                    :disabled="(!chatInput.trim() && uploadedFiles.length === 0) || reportsStore.loading"
                    @click="handleSend"
                  >
                    <el-icon v-if="!reportsStore.loading"><Promotion /></el-icon>
                    <el-icon v-else class="is-loading"><Loading /></el-icon>
                  </button>
          </div>
        </div>
          </div>
          </div>
        </div>
      </section>
    </main>
  </div>
  <div v-else class="detail-container">
    <el-skeleton rows="8" animated />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import { useReportsStore } from '../stores/reports'

defineOptions({ name: 'ReportDetailView' })

const route = useRoute()
const reportsStore = useReportsStore()
const chatInput = ref('')
const messagesContainer = ref(null)
const isEditingOutline = ref(false)
const editingOutline = ref([])
const savingOutline = ref(false)
const selectedText = ref('')
const selectedRange = ref(null)
const selectionToolbarVisible = ref(false)
const toolbarPosition = ref({ top: '0px', left: '0px' })
const regenerating = ref(false)
const reportCanvas = ref(null)
const editingMessage = ref(null)
const editorMode = ref('split') // 'edit', 'preview', 'split'
const editingContent = ref('')
const savingContent = ref(false)
const markdownEditor = ref(null)
const uploadedFiles = ref([]) // 上传的文件列表
const fileInputRef = ref(null)
const fileUploadRef = ref(null)

const report = computed(() => reportsStore.currentReport)

// 规范化大纲数据用于显示（兼容新旧格式）
const normalizedOutline = computed(() => {
  if (!report.value?.outline) return []
  return normalizeOutline(report.value.outline)
})

// 从对话历史中提取所有上传的文件（去重）
const uploadedFilesList = computed(() => {
  const filesMap = new Map()
  const conversations = reportsStore.conversations || []
  
  conversations.forEach(msg => {
    if (msg.files && Array.isArray(msg.files)) {
      msg.files.forEach(file => {
        // 使用文件名作为key去重
        if (!filesMap.has(file.name)) {
          filesMap.set(file.name, file)
        }
      })
    }
  })
  
  // 也包含当前会话中未发送的文件
  uploadedFiles.value.forEach(file => {
    if (!filesMap.has(file.name)) {
      filesMap.set(file.name, {
        name: file.name,
        size: file.size,
        type: file.type
      })
    }
  })
  
  return Array.from(filesMap.values())
})

const renderedContent = computed(() => {
  if (!report.value?.content) return ''
  const cleaned = cleanMarkdownContent(report.value.content)
  try {
    return marked.parse(cleaned)
  } catch (error) {
    console.error('Markdown 渲染错误:', error)
    return cleaned.replace(/\n/g, '<br>')
  }
})

// 清理内容中的代码块标记
function cleanMarkdownContent(content) {
  if (!content) return ''
  
  // 如果是 HTML 格式（包含标签），先提取文本内容
  let textContent = content
  if (typeof content === 'string' && content.includes('<') && content.includes('>')) {
    try {
      // 创建临时 DOM 元素提取文本
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      textContent = tempDiv.textContent || tempDiv.innerText || content
    } catch (error) {
      // 如果解析失败，使用原始内容
      textContent = content
    }
  }
  
  let cleaned = textContent.trim()
  
  // 如果清理后为空，使用原始内容
  if (!cleaned) {
    cleaned = content.trim()
  }
  
  // 移除开头的 markdown 代码块标记
  cleaned = cleaned.replace(/^```(?:json|markdown)?\s*\n?/i, '')
  cleaned = cleaned.replace(/^```\s*\n?/i, '')
  
  // 移除结尾的代码块标记
  cleaned = cleaned.replace(/\n?```\s*$/i, '')
  
  // 清理多余的空白行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()
  
  // 确保清理后不为空
  if (!cleaned) {
    console.warn('清理后内容为空，返回原始内容')
    return content.trim()
  }
  
  return cleaned
}

// 预览内容（实时更新）
const previewContent = computed(() => {
  const content = editingContent.value || report.value?.content || ''
  if (!content) return ''
  
  const cleaned = cleanMarkdownContent(content)
  try {
    return marked.parse(cleaned)
  } catch (error) {
    console.error('Markdown 渲染错误:', error)
    return cleaned.replace(/\n/g, '<br>')
  }
})

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
  return ts ? new Date(ts).toLocaleString('zh-CN') : ''
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

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function handleSend() {
  if (!chatInput.value.trim() && uploadedFiles.value.length === 0) return
  
  let message = chatInput.value.trim()
  
  // 如果有选中的文本，将其包含在消息中
  // 注意：不要清除选中文本，保留它以便后续应用到报告
  if (selectedText.value) {
    message = `针对以下内容：\n\n"${selectedText.value}"\n\n${message}`
    // 不清除选中文本，保留以便应用到报告时使用
  }
  
  // 如果有上传的文件，添加到消息中
  if (uploadedFiles.value.length > 0) {
    const fileList = uploadedFiles.value.map(f => `- ${f.name} (${formatFileSize(f.size)})`).join('\n')
    message = message ? `${message}\n\n上传的文件：\n${fileList}` : `上传的文件：\n${fileList}`
  }
  
  const messageToSend = message
  const filesToSend = [...uploadedFiles.value] // 复制文件列表
  
  // 清空输入和文件
  chatInput.value = ''
  uploadedFiles.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
  uploadedFiles.value = []
  
  // 立即添加用户消息和"答案生成中"的AI消息到store
  const now = new Date().toISOString()
  const tempUserMsgId = `temp_user_${Date.now()}`
  const tempBotMsgId = `temp_bot_${Date.now()}`
  
  const userMsg = {
    id: tempUserMsgId,
    role: 'user',
    message: messageToSend,
    files: filesToSend.map(f => ({ name: f.name, size: f.size, type: f.type })),
    created_at: now
  }
  const botMsg = {
    id: tempBotMsgId,
    role: 'assistant',
    message: '答案生成中',
    created_at: now,
    pending: true
  }
  
  // 立即添加到对话列表
  reportsStore.conversations.push(userMsg, botMsg)
  
  // 立即等待DOM更新并滚动
  await nextTick()
  scrollToBottom()
  
  // 异步发送请求
  reportsStore.sendChat(route.params.id, messageToSend, filesToSend).then(result => {
  if (!result.success) {
    ElMessage.error(result.message)
    }
    // 等待消息更新后再次滚动
    nextTick().then(() => {
      scrollToBottom()
    })
  }).catch(error => {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  })
}

function handleNewLine() {
  // Shift+Enter 换行，不做任何处理
}

function handleSelectStart(e) {
  // 允许选择文本
  return true
}

function handleTextSelection(e) {
  // 延迟执行，确保选择完成
  setTimeout(() => {
    const selection = window.getSelection()
    
    // 检查是否有选择
    if (!selection || selection.rangeCount === 0) {
      // 如果没有选择，检查是否需要清除
      if (selectedText.value) {
        setTimeout(() => {
          const currentSelection = window.getSelection()
          if (!currentSelection || !currentSelection.toString().trim()) {
            clearSelection()
          }
        }, 200)
      }
      return
    }
    
    const range = selection.getRangeAt(0)
    
    // 检查选择是否在报告区域内
    if (!reportCanvas.value) {
      return
    }
    
    const reportElement = reportCanvas.value
    
    // 检查选择是否在报告元素内
    if (!reportElement.contains(range.commonAncestorContainer)) {
      return
    }
    
    const text = selection.toString().trim()
    
    // 忽略太短或太长的选择
    if (!text || text.length < 3 || text.length > 5000) {
      if (selectedText.value) {
        clearSelection()
      }
      return
    }
    
    // 更新选中的文本
    selectedText.value = text
    
    // 保存选中范围，用于后续替换
    try {
      selectedRange.value = range.cloneRange()
    } catch (error) {
      console.warn('无法保存选中范围:', error)
    }
    
    // 获取选中文本的位置（相对于视口，因为工具栏是 fixed 定位）
    const rect = range.getBoundingClientRect()
    
    // 计算工具栏位置（在选中文本上方，居中）
    const toolbarWidth = 220 // 估算工具栏宽度
    const toolbarHeight = 40 // 估算工具栏高度
    
    // 计算水平位置：选中文本中心 - 工具栏宽度的一半
    const left = Math.max(10, Math.min(
      rect.left + (rect.width / 2) - (toolbarWidth / 2),
      window.innerWidth - toolbarWidth - 10
    ))
    
    // 计算垂直位置：选中文本上方，但要确保不超出视口
    const top = Math.max(10, rect.top - toolbarHeight - 8)
    
    toolbarPosition.value = {
      top: `${top}px`,
      left: `${left}px`,
      position: 'fixed'
    }
    
    selectionToolbarVisible.value = true
  }, 50)
}

function handleCanvasClick(e) {
  // 如果点击的是工具栏，不处理
  if (e.target.closest('.selection-toolbar')) {
    return
  }
  
  // 延迟检查，避免与选择事件冲突
  setTimeout(() => {
    const selection = window.getSelection()
    if (!selection || !selection.toString().trim()) {
      clearSelection()
    }
  }, 100)
}

function clearSelection() {
  selectedText.value = ''
  selectedRange.value = null
  selectionToolbarVisible.value = false
}

function handleQuickEdit() {
  if (!selectedText.value) return
  // 自动填充输入框
  chatInput.value = `请优化以下内容：\n\n"${selectedText.value}"\n\n要求：保持风格一致，内容更精炼。`
  // 聚焦输入框
  setTimeout(() => {
    const textarea = document.querySelector('.chat-textarea textarea')
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, 100)
}

function formatMessage(text) {
  if (!text) return ''
  
  // 清理可能的代码块标记
  let cleaned = text.trim()
  
  // 移除开头的 markdown 代码块标记
  cleaned = cleaned.replace(/^```(?:json|markdown)?\s*\n?/i, '')
  cleaned = cleaned.replace(/^```\s*\n?/i, '')
  
  // 移除结尾的代码块标记
  cleaned = cleaned.replace(/\n?```\s*$/i, '')
  
  // 使用 markdown 渲染
  try {
    return marked.parse(cleaned)
  } catch (error) {
    console.error('Markdown 渲染错误:', error)
    // 如果渲染失败，至少保留换行
    return cleaned.replace(/\n/g, '<br>')
  }
}

async function applyToReport(newContent) {
  if (!newContent || !newContent.trim()) {
    ElMessage.warning('没有可应用的内容')
    return
  }
  
  // 清理内容
  let cleanedContent = cleanMarkdownContent(newContent)
  
  // 验证清理后的内容不为空
  if (!cleanedContent || !cleanedContent.trim()) {
    console.error('清理后的内容为空，原始内容:', newContent)
    ElMessage.warning('内容格式不正确，无法应用')
    return
  }
  
  // 如果没有选中文本，需要用户确认是否替换整个内容
  if (!selectedText.value || !selectedText.value.trim()) {
    // 使用 ElMessageBox 确认操作
    try {
      await ElMessageBox.confirm(
        '未选中任何文本，将替换整个报告内容。是否继续？',
        '确认操作',
        {
          confirmButtonText: '确认替换',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
    } catch {
      // 用户取消操作
      return
    }
    
    // 确认操作
    try {
      editingContent.value = cleanedContent
      const result = await reportsStore.updateReportContent(route.params.id, cleanedContent)
      if (result.success) {
        ElMessage.success('内容已更新到报告')
        await refresh()
  } else {
        ElMessage.error(result.message || '更新失败')
        // 恢复原内容
        await refresh()
      }
    } catch (error) {
      console.error('更新报告内容失败:', error)
      ElMessage.error('更新失败')
      // 恢复原内容
      await refresh()
    }
    return
  }
  
  // 如果有选中文本，进行替换
  try {
    const currentContent = editingContent.value || report.value?.content || ''
    if (!currentContent || !currentContent.trim()) {
      ElMessage.warning('报告内容为空')
      return
    }
    
    // 查找选中文本在原始内容中的位置（考虑可能的格式差异）
    const selectedTextPlain = selectedText.value.trim()
    console.log('选中的文本:', selectedTextPlain.substring(0, 100))
    console.log('当前内容长度:', currentContent.length)
    
    let updatedContent = currentContent
    let replaced = false
    
    // 尝试精确匹配（只替换第一个匹配项）
    const index = currentContent.indexOf(selectedTextPlain)
    if (index !== -1) {
      updatedContent = currentContent.substring(0, index) + cleanedContent + currentContent.substring(index + selectedTextPlain.length)
      replaced = true
      console.log('精确匹配成功，位置:', index)
    } else {
      // 如果精确匹配失败，尝试模糊匹配（移除空白字符差异）
      const normalizedSelected = selectedTextPlain.replace(/\s+/g, ' ')
      const normalizedCurrent = currentContent.replace(/\s+/g, ' ')
      
      if (normalizedCurrent.includes(normalizedSelected)) {
        // 找到匹配位置，进行替换
        const index = normalizedCurrent.indexOf(normalizedSelected)
        // 计算原始位置
        let originalIndex = 0
        let normalizedIndex = 0
        while (normalizedIndex < index && originalIndex < currentContent.length) {
          if (currentContent[originalIndex].match(/\s/)) {
            // 跳过多个空白字符
            while (originalIndex < currentContent.length && currentContent[originalIndex].match(/\s/)) {
              originalIndex++
            }
          } else {
            originalIndex++
          }
          normalizedIndex++
        }
        
        // 找到原始内容中对应的结束位置
        let endIndex = originalIndex
        let matchLength = 0
        while (matchLength < normalizedSelected.length && endIndex < currentContent.length) {
          if (!currentContent[endIndex].match(/\s/)) {
            matchLength++
          }
          endIndex++
        }
        
        updatedContent = currentContent.substring(0, originalIndex) + cleanedContent + currentContent.substring(endIndex)
        replaced = true
        console.log('模糊匹配成功，原始位置:', originalIndex, '-', endIndex)
      }
    }
    
    if (!replaced) {
      // 如果都找不到，提示用户
      ElMessage.warning('无法在报告中找到选中的文本，请重新选择文本后再应用')
      console.warn('无法找到选中文本')
      console.warn('选中文本前50字符:', selectedTextPlain.substring(0, 50))
      console.warn('当前内容前100字符:', currentContent.substring(0, 100))
      return
    }
    
    // 验证替换后的内容不为空
    if (!updatedContent || !updatedContent.trim()) {
      ElMessage.error('替换后内容为空，操作已取消')
      return
    }
    
    // 验证替换后的内容长度合理（不应该比原内容短太多）
    if (updatedContent.length < currentContent.length * 0.1) {
      ElMessage.error('替换后内容异常，操作已取消')
      console.error('替换后内容异常短，原长度:', currentContent.length, '新长度:', updatedContent.length)
      return
    }
    
    console.log('替换成功，原长度:', currentContent.length, '新长度:', updatedContent.length)
    editingContent.value = updatedContent
    
    const result = await reportsStore.updateReportContent(route.params.id, updatedContent)
    
    if (result.success) {
      ElMessage.success('内容已更新到报告')
      clearSelection()
      await refresh()
    } else {
      ElMessage.error(result.message || '更新失败')
      // 恢复原内容
      await refresh()
    }
  } catch (error) {
    console.error('应用内容到报告失败:', error)
    ElMessage.error('更新失败')
    // 恢复原内容
    await refresh()
  }
}

function handleExport() {
  const content = editingContent.value || report.value?.content
  if (!content) {
    ElMessage.warning('报告内容为空')
    return
  }
  
  // 创建下载链接
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.value.title || 'report'}.md`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报告已导出')
}

function scrollToBottom() {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function handleGenerate() {
  const result = await reportsStore.generateReport(route.params.id)
  if (result.success) {
    ElMessage.success('生成完成')
  } else {
    ElMessage.error(result.message)
  }
}

async function refresh() {
  const result = await reportsStore.fetchReportDetail(route.params.id)
  if (!result.success) {
    ElMessage.error(result.message)
  } else {
    // 更新编辑内容
    if (report.value?.content) {
      editingContent.value = report.value.content
    }
  }
}

// 保存内容
async function saveContent() {
  if (!editingContent.value.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }
  
  savingContent.value = true
  try {
    const result = await reportsStore.updateReportContent(route.params.id, editingContent.value)
    if (result.success) {
      ElMessage.success('内容已保存')
      await refresh()
    } else {
      ElMessage.error(result.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    savingContent.value = false
  }
}

// 编辑器文本选择
function handleEditorSelection(e) {
  const textarea = e.target
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = editingContent.value.substring(start, end).trim()
  
  if (selected && selected.length > 0) {
    selectedText.value = selected
    selectionToolbarVisible.value = false // 编辑器模式下不显示工具栏
  } else {
    clearSelection()
  }
}

// 转换旧格式到新格式（兼容性）
function normalizeOutline(outline) {
  if (!outline || !Array.isArray(outline)) return []
  return outline.map(item => {
    // 如果已经是新格式（有 level 或 children），直接返回
    if (item.level !== undefined || item.children !== undefined) {
      return {
        title: item.title || '',
        level: item.level || 1,
        children: item.children ? normalizeOutline(item.children) : []
      }
    }
    // 旧格式：{title, bullets}，转换为新格式
    if (item.bullets && Array.isArray(item.bullets)) {
      return {
        title: item.title || '',
        level: 1,
        children: item.bullets.map(bullet => ({
          title: bullet,
          level: 2,
          children: []
        }))
      }
    }
    // 默认格式
    return {
      title: item.title || '',
      level: 1,
      children: []
    }
  })
}

// 大纲编辑功能
function startEditOutline() {
  if (!report.value?.outline) return
  const normalized = normalizeOutline(report.value.outline)
  editingOutline.value = JSON.parse(JSON.stringify(normalized))
  isEditingOutline.value = true
}

function cancelEditOutline() {
  isEditingOutline.value = false
  editingOutline.value = []
}

function addOutlineItem() {
  editingOutline.value.push({
    title: '',
    level: 1,
    children: []
  })
}

function removeOutlineItem(path) {
  if (path.length === 1) {
    editingOutline.value.splice(path[0], 1)
  } else if (path.length === 2) {
    editingOutline.value[path[0]].children.splice(path[1], 1)
  } else if (path.length === 3) {
    editingOutline.value[path[0]].children[path[1]].children.splice(path[2], 1)
  }
}

function updateOutlineItem(path, updates) {
  if (path.length === 1) {
    Object.assign(editingOutline.value[path[0]], updates)
  } else if (path.length === 2) {
    Object.assign(editingOutline.value[path[0]].children[path[1]], updates)
  } else if (path.length === 3) {
    Object.assign(editingOutline.value[path[0]].children[path[1]].children[path[2]], updates)
  }
}

function addChildItem(path) {
  if (path.length === 1) {
    const parent = editingOutline.value[path[0]]
    if (!parent.children) parent.children = []
    parent.children.push({
      title: '',
      level: (parent.level || 1) + 1,
      children: []
    })
  } else if (path.length === 2) {
    const parent = editingOutline.value[path[0]].children[path[1]]
    if (!parent.children) parent.children = []
    parent.children.push({
      title: '',
      level: (parent.level || 2) + 1,
      children: []
    })
  } else if (path.length === 3) {
    const parent = editingOutline.value[path[0]].children[path[1]].children[path[2]]
    if (!parent.children) parent.children = []
    parent.children.push({
      title: '',
      level: (parent.level || 3) + 1,
      children: []
    })
  }
}

async function saveOutline() {
  // 验证和清理数据
  function cleanOutline(items) {
    return items
      .filter(item => item.title && item.title.trim())
      .map(item => ({
        title: item.title.trim(),
        level: item.level || 1,
        children: item.children && item.children.length > 0 ? cleanOutline(item.children) : []
      }))
  }

  const validOutline = cleanOutline(editingOutline.value)

  if (validOutline.length === 0) {
    ElMessage.warning('请至少保留一个有效的标题')
    return
  }

  savingOutline.value = true
  try {
    const result = await reportsStore.saveOutline(route.params.id, {
      outline: validOutline,
      highlights: report.value.highlights || []
    })

    if (result.success) {
      ElMessage.success('大纲保存成功')
      isEditingOutline.value = false
      await refresh()
    } else {
      ElMessage.error(result.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    savingOutline.value = false
  }
}

// 点击其他地方时清除选择
function handleClickOutside(e) {
  // 如果点击的是工具栏或输入框，不清除选择
  if (e.target.closest('.selection-toolbar') || 
      e.target.closest('.chat-textarea') ||
      e.target.closest('.chat-input-container') ||
      e.target.closest('.selected-context')) {
    return
  }
  
  // 如果点击的不是报告区域，清除选择
  if (!e.target.closest('.report-canvas')) {
    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || !selection.toString().trim()) {
        clearSelection()
      }
    }, 100)
  }
}

onMounted(async () => {
  await refresh()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(
  () => reportsStore.conversations.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

// 监听报告内容变化，更新编辑内容
watch(
  () => report.value?.content,
  (newContent) => {
    if (newContent && editingContent.value !== newContent) {
      editingContent.value = newContent
    } else if (!newContent) {
      editingContent.value = ''
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.detail-container {
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

.detail-header {
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.eyebrow {
  color: #86868b;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 0 0 4px 0;
}

.detail-header h2 {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1d1d1f;
  margin: 0 0 4px 0;
}

.muted {
  color: #86868b;
  font-size: 15px;
  font-weight: 400;
}

/* 统一状态标签颜色（与报告列表页面保持一致） */
.detail-header .el-tag--success,
.detail-container .el-tag--success {
  background: #34C759 !important;
  color: white !important;
}

.detail-header .el-tag--info,
.detail-container .el-tag--info {
  background: #5AC8FA !important;
  color: white !important;
}

.detail-header .el-tag--warning,
.detail-container .el-tag--warning {
  background: #FF9500 !important;
  color: white !important;
}

.detail-header .el-tag--danger,
.detail-container .el-tag--danger {
  background: #FF3B30 !important;
  color: white !important;
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
}

.header-actions :deep(.el-button.is-loading) {
  padding-left: 20px;
  padding-right: 20px;
}

.header-actions :deep(.el-button--primary) {
  background: #007AFF !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3) !important;
}

.header-actions :deep(.el-button--primary:hover) {
  background: #0051D5 !important;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4) !important;
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

.content {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

.left {
  padding: 16px;
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.left::-webkit-scrollbar {
  width: 6px;
}

.left::-webkit-scrollbar-track {
  background: transparent;
}

.left::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.left::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.block {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.block + .block {
  margin-top: 16px;
}

.outline {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.outline-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.outline-item-view {
  margin-bottom: 6px;
}

.outline-title {
  font-weight: 600;
  margin-bottom: 6px;
  padding: 10px 14px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: default;
  display: flex;
  align-items: center;
  gap: 8px;
}

.outline-title::before {
  content: '';
  width: 4px;
  height: 16px;
  border-radius: 2px;
  flex-shrink: 0;
}

.outline-title.level-1 {
  font-size: 16px;
  font-weight: 700;
  color: white;
  background: #007AFF;
  margin-left: 0 !important;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  border-radius: 12px;
}

.outline-title.level-1::before {
  display: none;
}

.outline-title.level-2 {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  background: rgba(0, 122, 255, 0.05);
  border-left: 4px solid #007AFF;
}

.outline-title.level-2::before {
  background: #007AFF;
}

.outline-title.level-3 {
  font-size: 13px;
  font-weight: 500;
  color: #86868b;
  background: rgba(142, 142, 147, 0.05);
  border-left: 4px solid #86868b;
}

.outline-title.level-3::before {
  background: #86868b;
}

.outline-item-view .outline-title {
  margin-bottom: 6px;
}

.bullets {
  margin: 0;
  padding-left: 16px;
  color: var(--text-secondary);
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.block-header h3 {
  margin: 0;
}

.block-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.block-actions :deep(.el-button) {
  border-radius: 12px;
  font-weight: 500;
  font-size: 13px;
  padding: 6px 14px;
  height: auto;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.outline-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding-right: 4px;
}

.outline-editor::-webkit-scrollbar {
  width: 6px;
}

.outline-editor::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.outline-editor::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.outline-editor::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.outline-item-editor {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.2s ease;
  position: relative;
  margin-bottom: 8px;
  min-width: 0;
}

.outline-item-editor:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.outline-item-editor[style*="marginLeft: 0px"],
.outline-item-editor[style*="marginLeft: 0"] {
  border-left: 3px solid #007AFF;
  padding-left: 12px;
  background: linear-gradient(to right, rgba(0, 122, 255, 0.03) 0%, #ffffff 8%);
}

.outline-item-editor[style*="marginLeft: 20px"] {
  border-left: 3px solid #86868b;
  padding-left: 12px;
  background: linear-gradient(to right, rgba(142, 142, 147, 0.03) 0%, #ffffff 8%);
}

.outline-item-editor[style*="marginLeft: 40px"] {
  border-left: 3px solid #86868b;
  padding-left: 12px;
  background: linear-gradient(to right, rgba(142, 142, 147, 0.03) 0%, #ffffff 8%);
}

.outline-item-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 0;
  min-width: 0;
}

.outline-level-badge {
  flex-shrink: 0;
  width: 36px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #007AFF;
  color: white;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 122, 255, 0.3);
}

.outline-item-editor[style*="marginLeft: 20px"] .outline-level-badge {
  background: #86868b;
}

.outline-item-editor[style*="marginLeft: 40px"] .outline-level-badge {
  background: linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%);
}

.outline-title-input {
  flex: 1;
  min-width: 150px;
}

.outline-title-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  transition: all 0.2s ease;
  padding: 8px 12px;
  background: #f8fafc;
}

.outline-title-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
  background: #ffffff;
}

.outline-title-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  border-color: #007AFF;
  background: #ffffff;
}

.outline-title-input :deep(.el-input__inner) {
  font-size: 13px;
  color: #1e293b;
}

.outline-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  align-items: center;
  flex-wrap: wrap;
}

.outline-actions :deep(.el-button) {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 10px;
  font-weight: 500;
  white-space: nowrap;
  height: auto;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.outline-actions .el-button--primary {
  background: #007AFF !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3) !important;
  border-radius: 12px !important;
}

.outline-actions .el-button--primary:hover {
  background: #0051D5 !important;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4) !important;
  transform: translateY(-1px);
}

.outline-actions .el-button--danger {
  color: #ef4444;
}

.outline-actions .el-button--danger:hover {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
}

.bullets-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 8px;
  margin-top: 12px;
}

.bullet-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.bullet-input {
  flex: 1;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  padding: 6px 12px;
  border-radius: 12px;
  background: rgba(0, 122, 255, 0.06);
  color: #007AFF;
  font-weight: 600;
  border: 0.5px solid rgba(0, 122, 255, 0.12);
}

.file-sources {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.file-source-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: #f5f7fa;
  transition: all 0.2s ease;
}

.file-source-item:hover {
  background: #eef2f7;
  border-color: #c0c4cc;
}

.file-source-icon {
  color: #606266;
  font-size: 16px;
  flex-shrink: 0;
}

.file-source-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-source-size {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.metric {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.label {
  color: var(--text-muted);
  font-size: 12px;
}

.value {
  display: block;
  font-weight: 700;
  margin-top: 4px;
}

.right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Canvas 布局 */
.canvas-layout {
  height: 100%;
  min-height: 600px;
}

.canvas-container {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

.canvas-report {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.editor-wrapper.mode-edit {
  flex-direction: column;
}

.editor-wrapper.mode-preview {
  flex-direction: column;
}

.editor-wrapper.mode-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.report-toolbar {
  padding: 12px 16px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.report-toolbar h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.toolbar-actions :deep(.el-button) {
  border-radius: 12px;
  font-weight: 500;
  font-size: 13px;
  padding: 6px 14px;
  height: auto;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.toolbar-actions :deep(.el-button .el-icon) {
  font-size: 14px;
  margin-right: 4px;
}

.editor-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.markdown-editor {
  flex: 1;
  height: 100%;
  min-height: 0;
}

.markdown-editor :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  border-radius: 0;
  padding: 20px;
  resize: none;
  background: rgba(255, 255, 255, 0.5);
  height: 100% !important;
  color: #1d1d1f;
}

.markdown-editor :deep(.el-textarea__inner):focus {
  border: none;
  box-shadow: none;
  background: rgba(255, 255, 255, 0.9);
}

.preview-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #ffffff;
  position: relative;
  user-select: text;
  min-height: 0;
}

.preview-container.split-preview {
  border-left: 1px solid #e4e7ed;
  overflow-y: auto;
}

.markdown-preview::selection {
  background: rgba(99, 102, 241, 0.2);
}

.report-canvas {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #ffffff;
  position: relative;
  user-select: text;
}

.report-canvas::selection {
  background: rgba(99, 102, 241, 0.2);
}

.canvas-chat {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 0.5px solid rgba(0, 0, 0, 0.08);
  height: 100%;
  max-height: calc(100vh - 200px);
}

.chat-container {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 800px;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  flex-shrink: 0;
}

.chat-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1d1d1f;
}

.selected-context {
  padding: 12px 16px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 122, 255, 0.05);
  flex-shrink: 0;
}

.context-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #007AFF;
}

.context-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafafa;
  min-height: 0;
}

.message-wrapper {
  display: flex;
  gap: 12px;
  max-width: 100%;
}

.message-wrapper.assistant {
  justify-content: flex-start;
}

.message-wrapper.user {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.avatar-assistant {
  background: #007AFF;
  color: white;
}

.avatar-user {
  background: #86868b;
  color: white;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 44px);
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.bubble-assistant {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-top-left-radius: 12px;
  border-radius: 12px;
  color: #1d1d1f;
}

.bubble-user {
  background: #007AFF;
  color: white;
  border-top-right-radius: 4px;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
}

.pending-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-style: italic;
}

.pending-message .el-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  gap: 8px;
}

.bubble-user .message-actions {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.message-actions :deep(.el-button) {
  border-radius: 12px;
  font-weight: 500;
  font-size: 12px;
  padding: 6px 12px;
  height: auto;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.message-actions :deep(.el-button .el-icon) {
  font-size: 14px;
}

.message-time {
  font-size: 11px;
  color: #909399;
  opacity: 0.7;
}

.bubble-user .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-chat p {
  margin: 0;
  font-size: 14px;
}

.uploaded-files-preview {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #ffffff;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.file-preview-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.image-preview {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
}

.image-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
}

.file-icon {
  font-size: 24px;
  color: #6366f1;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 12px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.file-size {
  font-size: 11px;
  color: #909399;
}

.remove-file-btn {
  margin-left: auto;
  flex-shrink: 0;
}

.upload-button {
  color: #606266;
}

.upload-button:hover {
  color: #6366f1;
}

.message-files {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bubble-user .message-files {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.message-file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.bubble-user .message-file-item {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.message-file-item .file-size-text {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.7;
}

.chat-input-container {
  padding: 16px 20px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
}

.input-wrapper-dark {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border-radius: 18px;
  padding: 8px 12px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
}

.upload-trigger {
  display: inline-block;
}

.attach-button {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border: none;
  background: transparent;
  color: #86868b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.attach-button:hover:not(:disabled) {
  background: rgba(142, 142, 147, 0.1);
  color: #1d1d1f;
}

.attach-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-textarea-dark {
  flex: 1;
  min-width: 0;
}

.chat-textarea-dark :deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 8px 12px;
  font-size: 14px;
  color: #303133;
  resize: none;
  box-shadow: none;
  transition: none;
  line-height: 1.5;
}

.chat-textarea-dark :deep(.el-textarea__inner):focus {
  border: none;
  box-shadow: none;
  outline: none;
}

.chat-textarea-dark :deep(.el-textarea__inner)::placeholder {
  color: #909399;
}

.chat-textarea-dark :deep(.el-textarea__inner):disabled {
  background: transparent;
  color: #c0c4cc;
}

.input-actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.send-button-dark {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border: none;
  background: #007AFF;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.send-button-dark:hover:not(:disabled) {
  background: #0051D5;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
  transform: translateY(-1px);
}

.send-button-dark:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #86868b;
}

.send-button-dark .is-loading {
  animation: rotate 1s linear infinite;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-textarea {
  flex: 1;
}

.chat-textarea :deep(.el-textarea__inner) {
  border-radius: 24px;
  border: 1px solid #e4e7ed;
  padding: 12px 16px;
  font-size: 14px;
  resize: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.chat-textarea :deep(.el-textarea__inner):focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  padding: 0;
  flex-shrink: 0;
  background: #007AFF;
  border: none;
}

.send-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.send-button:disabled {
  opacity: 0.5;
  transform: none;
}

.selected-text-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f4ff;
  border-radius: 8px;
  font-size: 12px;
  color: #6366f1;
}

.selected-text-hint .el-icon {
  font-size: 16px;
}

.selection-toolbar {
  position: fixed;
  z-index: 9999;
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  animation: slideDown 0.2s ease;
  pointer-events: auto;
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

.empty-chat .hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* Markdown 预览样式 */
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 20px;
  margin-bottom: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: #303133;
}

.markdown-preview :deep(h1) {
  font-size: 2em;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 8px;
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 6px;
}

.markdown-preview :deep(h3) {
  font-size: 1.25em;
}

.markdown-preview :deep(p) {
  margin-bottom: 12px;
  line-height: 1.7;
  color: #606266;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin-bottom: 12px;
  padding-left: 24px;
}

.markdown-preview :deep(li) {
  margin-bottom: 6px;
  line-height: 1.6;
}

.markdown-preview :deep(strong) {
  font-weight: 600;
  color: #303133;
}

.markdown-preview :deep(code) {
  padding: 2px 6px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.markdown-preview :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 12px;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #007AFF;
  padding-left: 16px;
  margin: 12px 0;
  color: #86868b;
  font-style: italic;
}

@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }
  
  .canvas-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .canvas-chat {
    border-left: none;
    border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  }
}

/* 全局按钮样式 - Bento 风格 */
:deep(.el-button) {
  border-radius: 18px;
  font-weight: 500;
  transition: all 0.2s ease;
}

:deep(.el-button--primary) {
  background: #007AFF !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3) !important;
}

:deep(.el-button--primary:hover) {
  background: #0051D5 !important;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4) !important;
  transform: translateY(-1px);
}

:deep(.el-button.is-text.type-primary) {
  color: #007AFF;
}

:deep(.el-button.is-text.type-primary:hover) {
  color: #0051D5;
  background: rgba(0, 122, 255, 0.1);
}

:deep(.el-button:not(.el-button--primary):not(.is-text)) {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  border: 0.5px solid rgba(0, 0, 0, 0.1) !important;
  color: #86868b !important;
}

:deep(.el-button:not(.el-button--primary):not(.is-text):hover) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(0, 0, 0, 0.15) !important;
  color: #1d1d1f !important;
}

:deep(.el-button.is-text) {
  color: #86868b;
  border-radius: 18px;
}

:deep(.el-button.is-text:hover) {
  color: #1d1d1f;
  background: rgba(142, 142, 147, 0.1);
}

:deep(.el-button--danger.is-text) {
  color: #FF3B30;
}

:deep(.el-button--danger.is-text:hover) {
  color: #FF3B30;
  background: rgba(255, 59, 48, 0.1);
}
</style>

