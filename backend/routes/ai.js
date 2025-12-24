import express from 'express';
import axios from 'axios';
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 翻译文章摘要
router.post('/translate/:articleId', authenticateToken, async (req, res) => {
  try {
    const { articleId } = req.params;
    const { targetLanguage = 'en' } = req.body;
    
    // 获取文章摘要
    const results = await executeQuery(`
      SELECT ar.summary FROM ai_results ar 
      INNER JOIN articles a ON ar.article_id = a.id 
      WHERE a.id = ? AND a.user_id = ?
    `, [articleId, req.user.userId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: '文章不存在或尚无摘要' });
    }
    
    const summary = results[0].summary;
    
    if (!summary) {
      return res.status(400).json({ error: '文章摘要尚未生成' });
    }
    
    // 执行翻译
    const translation = await translateContent(summary, targetLanguage);
    
    // 更新翻译结果
    await executeQuery(`
      UPDATE ai_results 
      SET translation = ?, language = ?
      WHERE article_id = ?
    `, [translation, targetLanguage, articleId]);
    
    res.json({
      message: '摘要翻译完成',
      translation,
      language: targetLanguage
    });
    
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: '翻译失败' });
  }
});


// generateAnswer 函数已移除 - 现在通过 n8n 工作流处理问答

// 翻译内容
async function translateContent(content, targetLanguage) {
  try {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    const baseUrl = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn';
    
    const languageMap = {
      'en': '英文',
      'zh': '中文',
      'ja': '日文',
      'ko': '韩文',
      'fr': '法文',
      'de': '德文',
      'es': '西班牙文'
    };
    
    const targetLangName = languageMap[targetLanguage] || '英文';
    
    const response = await axios.post(`${baseUrl}/v1/chat/completions`, {
      model: 'Qwen/Qwen3-8B',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的翻译助手。请将用户提供的文章摘要翻译成${targetLangName}，保持原意和简洁性。`
        },
        {
          role: 'user',
          content: `请翻译以下文章摘要：\n\n${content}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content;
    
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('翻译失败');
  }
}

export default router;
