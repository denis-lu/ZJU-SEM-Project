import { ref, computed, onMounted, onUnmounted } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export const useArticlesStore = defineStore('articles', () => {
  const articles = ref([])
  const currentArticle = ref(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const articlesList = computed(() => articles.value)
  const isLoading = computed(() => loading.value)

  // 获取文章列表
  async function fetchArticles(page = 1, limit = 20) {
    loading.value = true
    try {
      const response = await axios.get(`${API_BASE_URL}/articles`, {
        params: { page, limit }
      })
      
      articles.value = response.data.articles
      pagination.value = response.data.pagination
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || '获取文章列表失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 获取单个文章详情
  async function fetchArticleDetail(articleId) {
    loading.value = true
    try {
      const response = await axios.get(`${API_BASE_URL}/articles/${articleId}`)
      currentArticle.value = response.data
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || '获取文章详情失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 添加新文章
  async function addArticle(url) {
    loading.value = true
    try {
      const response = await axios.post(`${API_BASE_URL}/articles`, { url })
      
      // 重新获取文章列表
      await fetchArticles(pagination.value.page)
      
      return { 
        success: true, 
        message: response.data.message,
        articleId: response.data.articleId
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || '添加文章失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 删除文章
  async function deleteArticle(articleId) {
    loading.value = true
    try {
      await axios.delete(`${API_BASE_URL}/articles/${articleId}`)
      
      // 从列表中移除
      articles.value = articles.value.filter(article => article.id !== articleId)
      
      return { success: true, message: '文章删除成功' }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || '删除文章失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // AI问答 - 通过n8n工作流
  async function askQuestion(articleId, question) {
    try {
      const response = await axios.post(`${API_BASE_URL}/articles/${articleId}/ask`, {
        question
      })
      
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || '问答失败' 
      }
    }
  }


  // 翻译文章
  async function translateArticle(articleId, targetLanguage) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/translate/${articleId}`, {
        targetLanguage
      })
      
      // 更新当前文章的翻译
      if (currentArticle.value && currentArticle.value.id === articleId) {
        currentArticle.value.translation = response.data.translation
        currentArticle.value.language = response.data.language
      }
      
      // 更新文章列表中对应的文章
      const articleIndex = articles.value.findIndex(a => a.id === articleId)
      if (articleIndex !== -1) {
        articles.value[articleIndex].translation = response.data.translation
        articles.value[articleIndex].language = response.data.language
      }
      
      return { success: true, message: response.data.message }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || '翻译失败' 
      }
    }
  }

  // 静默刷新文章详情（不显示loading状态）
  async function refreshArticleDetail(articleId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/articles/${articleId}`)
      if (currentArticle.value && currentArticle.value.id === articleId) {
        currentArticle.value = response.data
      }
      return { success: true, data: response.data }
    } catch (error) {
      console.warn('刷新文章详情失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '刷新文章详情失败' 
      }
    }
  }

  // 静默刷新文章列表（不显示loading状态）
  async function refreshArticlesList(page = 1, limit = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}/articles`, {
        params: { page, limit }
      })
      
      articles.value = response.data.articles
      pagination.value = response.data.pagination
      
      return { success: true }
    } catch (error) {
      console.warn('刷新文章列表失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '刷新文章列表失败' 
      }
    }
  }

  // 获取对话详情
  async function fetchConversationDetail(conversationId) {
    try {
      console.log(`请求对话详情: ${API_BASE_URL}/articles/conversations/${conversationId}`)
      const response = await axios.get(`${API_BASE_URL}/articles/conversations/${conversationId}`)
      console.log(`对话详情响应:`, response.data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error(`获取对话详情失败:`, error.response?.data || error.message)
      return { 
        success: false, 
        message: error.response?.data?.error || '获取对话详情失败' 
      }
    }
  }

  // 清除所有文章数据（用户切换时调用）
  function clearArticlesData() {
    articles.value = []
    currentArticle.value = null
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  }

  // 监听用户数据清除事件
  function handleUserDataClear() {
    clearArticlesData()
  }

  // 监听用户数据刷新事件
  async function handleUserDataRefresh() {
    try {
      await fetchArticles(1, 20)
    } catch (error) {
      console.warn('自动刷新文章数据失败:', error)
    }
  }

  // 设置事件监听器
  if (typeof window !== 'undefined') {
    window.addEventListener('user-data-clear', handleUserDataClear)
    window.addEventListener('user-data-refresh', handleUserDataRefresh)
  }

  return {
    articles,
    currentArticle,
    loading,
    pagination,
    articlesList,
    isLoading,
    fetchArticles,
    fetchArticleDetail,
    addArticle,
    deleteArticle,
    askQuestion,
    translateArticle,
    refreshArticleDetail,
    refreshArticlesList,
    fetchConversationDetail,
    clearArticlesData
  }
})
