import express from 'express';
import axios from 'axios';
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 安全解析keywords字段
function parseKeywords(keywords) {
  if (!keywords) {
    return [];
  }
  
  // 如果已经是数组，直接返回
  if (Array.isArray(keywords)) {
    return keywords;
  }
  
  // 如果是字符串，尝试解析
  if (typeof keywords === 'string') {
    try {
      // 尝试直接解析JSON
      const parsed = JSON.parse(keywords);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      // 如果JSON解析失败，尝试处理逗号分隔的字符串
      const cleaned = keywords.replace(/^["']|["']$/g, '').trim();
      if (cleaned.includes(',')) {
        return cleaned.split(',').map(k => k.trim()).filter(k => k.length > 0);
      } else if (cleaned.length > 0) {
        return [cleaned];
      }
    }
  }
  
  console.warn('无法解析keywords字段:', keywords);
  return [];
}

// 获取当前用户的所有文章
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit) || 20), 100);
    const offset = (pageNum - 1) * limitNum;
    const userId = req.user.userId;
    
    const articles = await executeQuery(`
      SELECT 
        a.*,
        ar.summary,
        ar.keywords,
        ar.translation,
        ar.language
      FROM articles a
      LEFT JOIN ai_results ar ON a.id = ar.article_id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, [userId]);
    
    // 为每篇文章获取问答对话数量
    const articlesWithConversations = await Promise.all(
      articles.map(async (article) => {
        const conversations = await executeQuery(
          'SELECT id, question, answer, status, created_at, answered_at FROM conversations WHERE article_id = ? ORDER BY created_at DESC',
          [article.id]
        );
        
        return {
          ...article,
          keywords: parseKeywords(article.keywords),
          conversations: conversations
        };
      })
    );
    
    // 获取当前用户文章总数
    const [{ total }] = await executeQuery(
      'SELECT COUNT(*) as total FROM articles WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      articles: articlesWithConversations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: '获取文章列表失败' });
  }
});

// 获取单个文章详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const articles = await executeQuery(`
      SELECT 
        a.*,
        ar.summary,
        ar.keywords,
        ar.translation,
        ar.language
      FROM articles a
      LEFT JOIN ai_results ar ON a.id = ar.article_id
      WHERE a.id = ? AND a.user_id = ?
    `, [id, userId]);
    
    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    const article = articles[0];
    
    // 获取相关的问答对话
    const conversations = await executeQuery(
      'SELECT * FROM conversations WHERE article_id = ? ORDER BY created_at DESC',
      [id]
    );
    
    res.json({
      ...article,
      keywords: parseKeywords(article.keywords),
      conversations
    });
    
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: '获取文章详情失败' });
  }
});

// 添加新文章（提交URL）
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;
    
    // 验证URL格式
    if (!url) {
      return res.status(400).json({ error: 'URL是必填项' });
    }
    
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: '无效的URL格式' });
    }
    
    // 检查是否已经添加过该URL
    const existingArticles = await executeQuery(
      'SELECT id FROM articles WHERE url = ? AND user_id = ?',
      [url, req.user.userId]
    );
    
    if (existingArticles.length > 0) {
      return res.status(409).json({ error: '该URL已经添加过了' });
    }
    
    // 创建文章记录
    const result = await executeQuery(
      'INSERT INTO articles (user_id, url, status) VALUES (?, ?, ?)',
      [req.user.userId, url, 'pending']
    );
    
    const articleId = result.insertId;
    
    // 触发n8n工作流处理
    await triggerN8nWorkflow(articleId, url);
    
    res.status(201).json({
      message: '文章添加成功，正在处理中...',
      articleId,
      url,
      status: 'pending'
    });
    
  } catch (error) {
    console.error('Add article error:', error);
    res.status(500).json({ error: '添加文章失败，请稍后重试' });
  }
});

// 删除文章
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查文章是否属于当前用户
    const articles = await executeQuery(
      'SELECT id FROM articles WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );
    
    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    // 删除文章（级联删除相关数据）
    await executeQuery('DELETE FROM articles WHERE id = ?', [id]);
    
    res.json({ message: '文章删除成功' });
    
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: '删除文章失败' });
  }
});

// 触发n8n工作流
async function triggerN8nWorkflow(articleId, url) {
  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/process-article';
    // const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/process-article';
    
    await axios.post(n8nWebhookUrl, {
      articleId,
      url,
      timestamp: new Date().toISOString()
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_API_KEY && { 'Authorization': `Bearer ${process.env.N8N_API_KEY}` })
      }
    });
    
    console.log(`✅ 成功触发n8n工作流处理文章 ${articleId}`);
    
  } catch (error) {
    console.error(`❌ 触发n8n工作流失败:`, error.message);
    
    // 更新文章状态为失败
    await executeQuery(
      'UPDATE articles SET status = ? WHERE id = ?',
      ['failed', articleId]
    );
  }
}

// 触发n8n问答工作流
async function triggerN8nQAWorkflow(articleId, question, conversationId, content) {
  try {
    const n8nQAWebhookUrl = process.env.N8N_QA_WEBHOOK_URL || 'http://localhost:5678/webhook/process-qa';
    // const n8nQAWebhookUrl = process.env.N8N_QA_WEBHOOK_URL || 'http://localhost:5678/webhook-test/process-qa';
    
    await axios.post(n8nQAWebhookUrl, {
      articleId,
      question,
      conversationId,
      content, // 传入文章内容
      timestamp: new Date().toISOString()
    }, {
      timeout: 30000, // 问答可能需要更长时间
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_API_KEY && { 'Authorization': `Bearer ${process.env.N8N_API_KEY}` })
      }
    });
    
    console.log(`✅ 成功触发n8n问答工作流 - 文章ID: ${articleId}, 对话ID: ${conversationId}`);
    
  } catch (error) {
    console.error(`❌ 触发n8n问答工作流失败:`, error.message);
    
    // 更新对话状态为失败
    await executeQuery(
      'UPDATE conversations SET status = ? WHERE id = ?',
      ['failed', conversationId]
    );
    
    throw error; // 重新抛出错误以便上层处理
  }
}

// 保存AI处理结果（n8n工作流专用端点）
router.put('/:id/ai-results', async (req, res) => {
  try {
    const { id } = req.params;
    const { summary, keywords, status = 'completed' } = req.body;
    
    console.log(`保存文章 ${id} 的AI处理结果:`, { summary: summary?.substring(0, 50) + '...', keywords, status });
    
    // 检查文章是否存在
    const articles = await executeQuery(
      'SELECT id FROM articles WHERE id = ?',
      [id]
    );
    
    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    // 更新或插入AI结果
    const keywordsJson = JSON.stringify(keywords || []);
    
    // 先检查是否已有AI结果
    const existingResults = await executeQuery(
      'SELECT id FROM ai_results WHERE article_id = ?',
      [id]
    );
    
    if (existingResults.length > 0) {
      // 更新现有结果
      await executeQuery(`
        UPDATE ai_results 
        SET summary = ?, keywords = ?
        WHERE article_id = ?
      `, [summary, keywordsJson, id]);
    } else {
      // 插入新结果
      await executeQuery(`
        INSERT INTO ai_results (article_id, summary, keywords) 
        VALUES (?, ?, ?)
      `, [id, summary, keywordsJson]);
    }
    
    // 更新文章状态
    await executeQuery(
      'UPDATE articles SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.json({ 
      success: true, 
      message: 'AI处理结果保存成功',
      articleId: parseInt(id)
    });
    
  } catch (error) {
    console.error('保存AI结果错误:', error);
    res.status(500).json({ error: '保存AI处理结果失败' });
  }
});

// 更新文章基本信息（n8n工作流专用端点）
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status = 'processing' } = req.body;
    
    console.log(`更新文章 ${id} 基本信息:`, { title, contentLength: content?.length, status });
    
    // 确保undefined值转换为null
    const safeTitle = title === undefined ? null : title;
    const safeContent = content === undefined ? null : content;
    const safeStatus = status === undefined ? 'processing' : status;
    
    // 更新文章基本信息
    await executeQuery(`
      UPDATE articles 
      SET title = ?, content = ?, status = ?
      WHERE id = ?
    `, [safeTitle, safeContent, safeStatus, id]);
    
    res.json({ 
      success: true, 
      message: '文章信息更新成功',
      articleId: parseInt(id),
      title: safeTitle,
      content: safeContent,
      status: safeStatus
    });
    
  } catch (error) {
    console.error('更新文章信息错误:', error);
    res.status(500).json({ error: '更新文章信息失败' });
  }
});

// 提问端点 - 基于文章内容问答（需要认证，确保用户只能对自己的文章提问）
router.post('/:id/ask', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;
    
    // 验证参数
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: '问题不能为空' });
    }
    
    // 检查文章是否存在、属于当前用户且已处理完成
    const articles = await executeQuery(`
      SELECT a.id, a.title, a.status, a.content 
      FROM articles a 
      WHERE a.id = ? AND a.user_id = ? AND a.status = 'completed'
    `, [id, req.user.userId]);
    
    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在或尚未处理完成' });
    }
    
    const article = articles[0];
    
    // 创建对话记录
    let conversationResult;
    try {
      conversationResult = await executeQuery(`
        INSERT INTO conversations (article_id, user_id, question, status) 
        VALUES (?, ?, ?, ?)
      `, [id, req.user.userId, question.trim(), 'pending']);
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes('status')) {
        // 如果status字段不存在，先尝试添加字段
        try {
          await executeQuery(`
            ALTER TABLE conversations 
            ADD COLUMN status VARCHAR(20) DEFAULT 'pending',
            ADD COLUMN answered_at TIMESTAMP NULL
          `);
          // 重新尝试插入
          conversationResult = await executeQuery(`
            INSERT INTO conversations (article_id, user_id, question, status) 
            VALUES (?, ?, ?, ?)
          `, [id, req.user.userId, question.trim(), 'pending']);
        } catch (alterError) {
          // 如果添加字段也失败，则使用原始插入方法
          conversationResult = await executeQuery(`
            INSERT INTO conversations (article_id, user_id, question) 
            VALUES (?, ?, ?)
          `, [id, req.user.userId, question.trim()]);
        }
      } else if (error.code === 'ER_BAD_NULL_ERROR' && error.sqlMessage.includes('user_id')) {
        // 如果user_id不能为null，先尝试修改表结构允许null
        try {
          await executeQuery(`
            ALTER TABLE conversations 
            MODIFY COLUMN user_id INT NULL
          `);
          // 重新尝试插入
          conversationResult = await executeQuery(`
            INSERT INTO conversations (article_id, user_id, question, status) 
            VALUES (?, ?, ?, ?)
          `, [id, req.user.userId, question.trim(), 'pending']);
        } catch (alterError) {
          // 如果修改表结构失败，使用当前用户ID
          conversationResult = await executeQuery(`
            INSERT INTO conversations (article_id, user_id, question, status) 
            VALUES (?, ?, ?, ?)
          `, [id, req.user.userId, question.trim(), 'pending']);
        }
      } else {
        throw error;
      }
    }
    
    const conversationId = conversationResult.insertId;
    
    // 触发n8n问答工作流
    try {
      await triggerN8nQAWorkflow(id, question.trim(), conversationId, article.content);
      
      res.status(201).json({
        success: true,
        message: 'AI正在思考您的问题，请稍候...',
        conversationId,
        articleId: parseInt(id),
        question: question.trim(),
        status: 'pending'
      });
      
    } catch (workflowError) {
      // 如果触发工作流失败，返回错误但保留对话记录
      res.status(500).json({
        error: 'AI问答服务暂时不可用，请稍后重试',
        conversationId,
        status: 'failed'
      });
    }
    
  } catch (error) {
    console.error('提问处理错误:', error);
    res.status(500).json({ error: '提问处理失败，请稍后重试' });
  }
});

// 保存问答结果（n8n工作流专用端点）
router.put('/conversations/:conversationId/answer', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { answer, status = 'completed' } = req.body;
    
    console.log(`保存对话 ${conversationId} 的AI回答:`, { 
      status 
    });
    
    // 验证参数
    if (!answer || answer.trim() === '') {
      return res.status(400).json({ error: '回答内容不能为空' });
    }
    
    // 检查对话是否存在
    const conversations = await executeQuery(
      'SELECT id, article_id FROM conversations WHERE id = ?',
      [conversationId]
    );
    
    if (conversations.length === 0) {
      return res.status(404).json({ error: '对话不存在' });
    }
    
    // 更新对话记录
    await executeQuery(`
      UPDATE conversations 
      SET answer = ?, status = ?, answered_at = NOW()
      WHERE id = ?
    `, [answer.trim(), status, conversationId]);
    
    res.json({
      success: true,
      message: 'AI回答保存成功',
      conversationId: parseInt(conversationId),
      answer: answer.trim(),
      status
    });
    
  } catch (error) {
    console.error('保存AI回答错误:', error);
    res.status(500).json({ error: '保存AI回答失败' });
  }
});

// 获取文章的所有问答对话
router.get('/:id/conversations', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit) || 10), 50);
    const offset = (pageNum - 1) * limitNum;
    const userId = req.user.userId;
    
    // 检查文章是否存在且属于当前用户
    const articles = await executeQuery(
      'SELECT id FROM articles WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    // 获取对话列表
    const conversations = await executeQuery(`
      SELECT 
        c.*,
        u.username
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.article_id = ?
      ORDER BY c.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, [id]);
    
    // 获取总数
    const [{ total }] = await executeQuery(
      'SELECT COUNT(*) as total FROM conversations WHERE article_id = ?',
      [id]
    );
    
    res.json({
      conversations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('获取对话列表错误:', error);
    res.status(500).json({ error: '获取对话列表失败' });
  }
});

// 获取单个对话详情
router.get('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    
    const conversations = await executeQuery(`
      SELECT 
        c.*,
        u.username,
        a.title as article_title
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN articles a ON c.article_id = a.id
      WHERE c.id = ? AND a.user_id = ?
    `, [conversationId, userId]);
    
    if (conversations.length === 0) {
      return res.status(404).json({ error: '对话不存在' });
    }
    
    res.json(conversations[0]);
    
  } catch (error) {
    console.error('获取对话详情错误:', error);
    res.status(500).json({ error: '获取对话详情失败' });
  }
});

export default router;
