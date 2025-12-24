import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export const useReportsStore = defineStore('reports', () => {
  const reports = ref([])
  const currentReport = ref(null)
  const conversations = ref([])
  const loading = ref(false)

  const isLoading = computed(() => loading.value)

  function withAuthHeader() {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
    }
  }

  async function fetchReports() {
    loading.value = true
    withAuthHeader()
    try {
      const { data } = await axios.get(`${API_BASE_URL}/reports`)
      reports.value = data.reports || []
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.error || '获取报告失败' }
    } finally {
      loading.value = false
    }
  }

  async function createReport(payload, files = []) {
    loading.value = true
    withAuthHeader()
    try {
      let response

      // 如果有文件，使用 FormData 上传
      if (files && files.length > 0) {
        const formData = new FormData()
        formData.append('title', payload.title)
        formData.append('industry', payload.industry)
        formData.append('scenario', payload.scenario || '')
        formData.append('objective', payload.objective || '')

        // 添加文件
        files.forEach((file, index) => {
          formData.append('files', file)
        })

        response = await axios.post(`${API_BASE_URL}/reports`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        // 没有文件，使用普通 JSON 请求
        response = await axios.post(`${API_BASE_URL}/reports`, payload)
      }

      await fetchReports()
      return { success: true, reportId: response.data.reportId, outline: response.data.outline }
    } catch (error) {
      return { success: false, message: error.response?.data?.error || '创建报告失败' }
    } finally {
      loading.value = false
    }
  }

  async function fetchReportDetail(reportId) {
    loading.value = true
    withAuthHeader()
    try {
      const { data } = await axios.get(`${API_BASE_URL}/reports/${reportId}`)
      console.log('前端接收到的报告数据:', data)
      console.log('前端接收到的 outline:', JSON.stringify(data.outline, null, 2))
      currentReport.value = data
      conversations.value = data.conversations || []
      return { success: true, data }
    } catch (error) {
      return { success: false, message: error.response?.data?.error || '获取报告详情失败' }
    } finally {
      loading.value = false
    }
  }

  async function generateReport(reportId) {
    loading.value = true
    withAuthHeader()
    try {
      const { data } = await axios.post(`${API_BASE_URL}/reports/${reportId}/generate`)
      if (currentReport.value && currentReport.value.id === Number(reportId)) {
        currentReport.value.content = data.content
        currentReport.value.status = 'completed'
        currentReport.value.metrics = data.metrics
      }
      await fetchReports()
      return { success: true, data }
    } catch (error) {
      return { success: false, message: error.response?.data?.error || '生成报告失败' }
    } finally {
      loading.value = false
    }
  }

  async function sendChat(reportId, message, files = []) {
    withAuthHeader()

    // 查找最后添加的临时消息（应该已经在前端添加了）
    const pendingBotMsg = conversations.value.findLast(msg => msg.role === 'assistant' && msg.pending)
    const lastUserMsg = conversations.value.findLast(msg => msg.role === 'user')

    const finalUserMsgId = lastUserMsg?.id
    const finalBotMsgId = pendingBotMsg?.id

    if (!finalUserMsgId || !finalBotMsgId) {
      console.warn('未找到临时消息，消息可能未正确添加')
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/reports/${reportId}/chat`, { message })

      // 检查返回的数据结构
      if (!data) {
        console.error('后端返回数据格式错误:', data)
        // 更新pending消息为错误状态
        const botIndex = conversations.value.findIndex(msg => msg.id === finalBotMsgId)
        if (botIndex !== -1) {
          conversations.value[botIndex].message = '生成失败，请稍后重试'
          conversations.value[botIndex].pending = false
        }
        return { success: false, message: '服务器返回数据格式错误' }
      }

      // 更新用户消息ID（如果有）
      const userIndex = conversations.value.findIndex(msg => msg.id === finalUserMsgId)
      if (userIndex !== -1 && data.userMessageId) {
        conversations.value[userIndex].id = data.userMessageId
      }

      // 更新AI消息
      const botIndex = conversations.value.findIndex(msg => msg.id === finalBotMsgId)
      if (botIndex !== -1) {
        conversations.value[botIndex].id = data.messageId || finalBotMsgId
        conversations.value[botIndex].message = data.reply || '生成失败'
        conversations.value[botIndex].pending = false
        conversations.value[botIndex].created_at = new Date().toISOString()
      }

      return { success: true }
    } catch (error) {
      console.error('发送聊天消息失败:', error)
      const errorMessage = error.response?.data?.error || error.message || '对话失败，请稍后重试'

      // 更新pending消息为错误状态
      // 查找最后一个pending的bot消息
      const botIndex = conversations.value.findIndex(msg => msg.role === 'assistant' && msg.pending)
      if (botIndex !== -1) {
        conversations.value[botIndex].message = errorMessage
        conversations.value[botIndex].pending = false
      }

      return { success: false, message: errorMessage }
    }
  }

  async function saveOutline(reportId, payload) {
    withAuthHeader()
    try {
      const { data } = await axios.put(`${API_BASE_URL}/reports/${reportId}/outline`, payload)
      if (currentReport.value && currentReport.value.id === Number(reportId)) {
        currentReport.value.outline = data.outline
        currentReport.value.highlights = data.highlights
      }
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.error || '保存大纲失败' }
    }
  }

  async function polishOutline(reportId, outline) {
    withAuthHeader()
    try {
      const { data } = await axios.post(`${API_BASE_URL}/reports/${reportId}/outline/polish`, { outline })
      if (currentReport.value && currentReport.value.id === Number(reportId)) {
        currentReport.value.outline = data.outline
        currentReport.value.highlights = data.highlights
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, message: error.response?.data?.error || '润色大纲失败' }
    }
  }

  async function updateReportContent(reportId, content) {
    withAuthHeader()
    try {
      const { data } = await axios.put(`${API_BASE_URL}/reports/${reportId}/content`, { content })
      if (currentReport.value && currentReport.value.id === Number(reportId)) {
        currentReport.value.content = content
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, message: error.response?.data?.error || '更新报告内容失败' }
    }
  }

  async function deleteReport(reportId) {
    loading.value = true
    withAuthHeader()
    try {
      await axios.delete(`${API_BASE_URL}/reports/${reportId}`)
      // 从列表中移除
      reports.value = reports.value.filter(r => r.id !== Number(reportId))
      // 如果删除的是当前查看的报告，清空当前报告
      if (currentReport.value && currentReport.value.id === Number(reportId)) {
        currentReport.value = null
        conversations.value = []
      }
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.error || '删除报告失败' }
    } finally {
      loading.value = false
    }
  }

  async function updateReportInfo(reportId, payload) {
    loading.value = true
    withAuthHeader()
    try {
      const { data } = await axios.put(`${API_BASE_URL}/reports/${reportId}/info`, payload)
      // 更新列表中的报告
      const index = reports.value.findIndex(r => r.id === Number(reportId))
      if (index !== -1) {
        reports.value[index] = { ...reports.value[index], ...payload }
      }
      // 如果正在查看该报告，也更新当前报告
      if (currentReport.value && currentReport.value.id === Number(reportId)) {
        currentReport.value = { ...currentReport.value, ...payload }
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, message: error.response?.data?.error || '更新报告信息失败' }
    } finally {
      loading.value = false
    }
  }

  return {
    reports,
    currentReport,
    conversations,
    loading,
    isLoading,
    fetchReports,
    createReport,
    fetchReportDetail,
    generateReport,
    sendChat,
    saveOutline,
    polishOutline,
    updateReportContent,
    deleteReport,
    updateReportInfo,
  }
})

