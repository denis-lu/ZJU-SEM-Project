import express from 'express';
import axios from 'axios';
import multer from 'multer';
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 配置 multer 用于文件上传（内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 通用LLM调用，优先使用硅基流动，缺省则返回模板内容
async function callLLM(prompt, { system = '你是产业研究员，回答要简洁、结构化。', maxTokens = 1800 } = {}) {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  const baseUrl = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn';

  if (!apiKey) {
    // 没有密钥时抛出错误，让调用方知道需要配置 API Key
    throw new Error('未配置 SILICONFLOW_API_KEY，请在环境变量中设置 API Key');
  }

  try {
    const response = await axios.post(
      `${baseUrl}/v1/chat/completions`,
      {
        model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.35,
        max_tokens: maxTokens,
        response_format: { type: 'text' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content || '';
    if (!content) {
      console.warn('LLM 返回空内容，响应数据:', JSON.stringify(response.data, null, 2));
      throw new Error('AI 服务返回空内容，请稍后重试');
    }

    return { content };
  } catch (error) {
    // 记录详细错误信息
    if (error.response) {
      console.error('LLM API 错误响应:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      throw new Error(`AI 服务调用失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('LLM API 请求超时或网络错误:', error.message);
      throw new Error('AI 服务连接超时，请检查网络连接或稍后重试');
    } else {
      console.error('LLM API 调用错误:', error.message);
      throw error;
    }
  }
}
function safeJSONParse(text, fallback = null) {
  if (!text) return fallback;

  // 如果已经是对象或数组，直接返回
  if (typeof text === 'object' && text !== null) {
    return text;
  }

  // 如果是字符串，尝试解析
  if (typeof text === 'string') {
    try {
      return JSON.parse(text);
    } catch (error) {
      return fallback;
    }
  }

  return fallback;
}

// 从 LLM 响应中提取 JSON 对象（支持 markdown 代码块格式）
function extractJSONFromText(text) {
  if (!text) return null;

  // 尝试直接解析
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // 忽略，继续尝试其他方法
  }

  // 尝试提取 markdown 代码块中的 JSON
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch (e) {
      // 忽略
    }
  }

  // 尝试提取第一个完整的 JSON 对象
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // 忽略
    }
  }

  return null;
}

// 兜底大纲，避免前端空白
function fallbackOutline() {
  return {
    outline: [
      { title: '行业概览', bullets: ['市场规模与增速', '典型玩家', '政策与监管'] },
      { title: '技术与供给', bullets: ['核心技术演进', '供应链与算力', '关键瓶颈'] },
      { title: '需求与场景', bullets: ['主要客户与痛点', '落地案例', '增量空间'] },
      { title: '竞争与壁垒', bullets: ['竞争格局', '差异化要素', '进入壁垒'] },
      { title: '风险与展望', bullets: ['政策/安全风险', '商业可持续性', '未来12-24个月展望'] },
    ],
    highlights: ['示例亮点：技术驱动供给升级', '示例亮点：需求侧结构性机会'],
    metrics: { timeline: '1 天', difficulty: '中', confidence: '0.72' },
  };
}

function ensureOutlineNotEmpty(existing) {
  if (!existing) return fallbackOutline();
  const outline = !existing.outline || existing.outline.length === 0 ? fallbackOutline().outline : existing.outline;
  const highlights = !existing.highlights || existing.highlights.length === 0 ? fallbackOutline().highlights : existing.highlights;
  const metrics = existing.metrics || fallbackOutline().metrics;
  // 保留原始对象的所有字段，只更新 outline, highlights, metrics
  return { ...existing, outline, highlights, metrics };
}

// 生成报告大纲与任务拆解（带兜底）
async function buildOutlinePayload({ title, industry, scenario, objective, dataSources }) {
  const prompt = `
为"${title}"生成产业研究报告的大纲和任务拆解。

要求：
1. 输出必须是有效的 JSON 格式
2. JSON 结构：{"outline": [{"title": "章节标题", "bullets": ["要点1", "要点2", "要点3"]}], "highlights": ["亮点1", "亮点2"], "metrics": {"timeline": "时间", "difficulty": "难度", "confidence": "置信度"}}
3. outline 数组包含 5-7 个章节，每个章节有 3-5 个要点
4. highlights 数组包含 3-5 条亮点
5. metrics 对象包含 timeline（如"1-2周"）、difficulty（如"中"）、confidence（如"0.75"）

报告信息：
- 行业: ${industry}
- 场景/用途: ${scenario || '未指定'}
- 目标: ${objective || '未指定'}
- 数据来源: ${dataSources?.join(', ') || '未指定'}

请直接输出 JSON，不要包含其他说明文字。
  `.trim();

  try {
    const { content } = await callLLM(prompt, {
      system: '你是一个专业的产业研究员。请严格按照要求输出 JSON 格式，不要添加任何解释性文字。',
      maxTokens: 1200
    });

    console.log('LLM 返回的原始内容:', content.substring(0, 500)); // 调试日志

    // 使用改进的 JSON 提取函数
    const parsed = extractJSONFromText(content);

    if (!parsed) {
      console.warn('无法从 LLM 响应中提取 JSON，使用兜底模板');
      return fallbackOutline();
    }

    console.log('解析后的 JSON:', JSON.stringify(parsed, null, 2)); // 调试日志

    // 验证和补全数据结构
    const result = {
      outline: Array.isArray(parsed.outline) && parsed.outline.length > 0
        ? parsed.outline
        : fallbackOutline().outline,
      highlights: Array.isArray(parsed.highlights) && parsed.highlights.length > 0
        ? parsed.highlights
        : fallbackOutline().highlights,
      metrics: parsed.metrics && typeof parsed.metrics === 'object'
        ? parsed.metrics
        : fallbackOutline().metrics,
    };

    // 验证 outline 结构
    result.outline = result.outline.map(item => ({
      title: item.title || '未命名章节',
      bullets: Array.isArray(item.bullets) ? item.bullets : []
    }));

    return result;
  } catch (error) {
    console.error('生成大纲调用LLM失败:', error);
    console.error('错误详情:', error.message);
    return fallbackOutline();
  }
}

// 清理 LLM 返回的内容
function cleanLLMContent(content) {
  let cleaned = content.trim();

  // 移除开头的 markdown 代码块标记
  cleaned = cleaned.replace(/^```(?:json|markdown)?\s*\n?/i, '');
  cleaned = cleaned.replace(/^```\s*\n?/i, '');

  // 移除结尾的代码块标记
  cleaned = cleaned.replace(/\n?```\s*$/i, '');

  // 清理多余的空白行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

// 提取并移除 metrics JSON
function extractMetrics(content) {
  const metricsMatch = content.match(/\{[\s\S]*\}/);
  if (metricsMatch) {
    const jsonStr = metricsMatch[0];
    const metrics = safeJSONParse(jsonStr, null);
    if (metrics) {
      const cleaned = content.replace(jsonStr, '').trim();
      return { content: cleaned.replace(/```(?:json)?\s*$/i, '').trim(), metrics };
    }
  }
  return { content, metrics: null };
}

// 为单个章节生成内容
async function generateSectionContent({
  title,
  sectionTitle,
  bullets,
  children,
  level,
  reportTitle,
  industry,
  scenario,
  objective,
  dataSources,
  previousSections = []
}) {
  // 构建章节要点文本
  const bulletsText = bullets && bullets.length > 0
    ? `\n要点：\n${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}`
    : '';

  // 构建子章节信息
  const childrenText = children && children.length > 0
    ? `\n子章节：\n${children.map((c, i) => `  ${i + 1}. ${c.title}`).join('\n')}`
    : '';

  // 构建已生成章节的上下文（用于保持连贯性）
  const contextText = previousSections.length > 0
    ? `\n\n已生成的章节摘要（供参考，保持风格一致）：\n${previousSections.slice(-2).map(s => `- ${s.title}: ${s.summary || '已生成'}`).join('\n')}`
    : '';

  const prompt = `
你正在为产业研究报告《${reportTitle}》生成第 ${level} 级章节内容。

报告信息：
- 行业: ${industry}
- 场景: ${scenario || '未指定'}
- 目标: ${objective || '未指定'}
- 数据来源: ${dataSources?.join(', ') || '未指定'}

当前章节：${sectionTitle}${bulletsText}${childrenText}${contextText}

要求：
1. 使用 Markdown 格式
2. 章节标题使用 ## ${sectionTitle}
3. 内容要详细、专业，包含具体数据和案例
4. 每个要点至少展开为 2-3 段内容
5. 如果有子章节，为每个子章节生成独立的 ## 标题和内容
6. 总字数控制在 800-1200 字
7. 不要输出 JSON 或其他格式标记，只输出 Markdown 内容

请生成该章节的完整内容：
  `.trim();

  const { content } = await callLLM(prompt, { maxTokens: 2000 });

  // 清理内容
  let cleanedContent = cleanLLMContent(content);

  // 确保章节标题格式正确
  if (!cleanedContent.includes(`## ${sectionTitle}`) && !cleanedContent.includes(`# ${sectionTitle}`)) {
    cleanedContent = `## ${sectionTitle}\n\n${cleanedContent}`;
  }

  return cleanedContent;
}

// 递归处理多级大纲
async function generateContentForOutline({
  outline,
  reportTitle,
  industry,
  scenario,
  objective,
  dataSources,
  level = 1,
  previousSections = []
}) {
  const sections = [];

  for (let i = 0; i < outline.length; i++) {
    const item = outline[i];
    const sectionTitle = item.title || `章节${i + 1}`;
    const bullets = item.bullets || [];
    const children = item.children || [];

    console.log(`正在生成章节 ${i + 1}/${outline.length}: ${sectionTitle}`);

    // 生成当前章节内容
    const sectionContent = await generateSectionContent({
      title: reportTitle,
      sectionTitle,
      bullets,
      children: children.length > 0 ? children : undefined,
      level,
      reportTitle,
      industry,
      scenario,
      objective,
      dataSources,
      previousSections
    });

    let finalSectionContent = sectionContent;

    // 如果有子章节，递归生成
    if (children && children.length > 0) {
      const childrenResult = await generateContentForOutline({
        outline: children,
        reportTitle,
        industry,
        scenario,
        objective,
        dataSources,
        level: level + 1,
        previousSections: [...previousSections, ...sections]
      });

      // 将子章节内容追加到当前章节
      finalSectionContent = sectionContent + '\n\n' + childrenResult.content;
    }

    sections.push({
      title: sectionTitle,
      content: finalSectionContent,
      summary: finalSectionContent.substring(0, 100) + '...'
    });

    // 添加短暂延迟，避免 API 限流
    if (i < outline.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 合并所有章节内容
  const fullContent = sections.map(s => s.content).join('\n\n');

  return {
    content: fullContent,
    sections: sections
  };
}

// 生成报告正文
async function buildReportContent({ title, industry, scenario, objective, outline, dataSources }) {
  // 规范化大纲结构（处理新旧格式）
  const normalizedOutline = normalizeOutlineForGeneration(outline || []);

  if (normalizedOutline.length === 0) {
    // 如果没有大纲，使用默认结构
    const defaultOutline = [
      { title: '执行摘要', bullets: ['报告概述', '核心发现', '关键数据'] },
      { title: '行业现状', bullets: ['市场概况', '发展趋势', '主要参与者'] },
      { title: '市场机会', bullets: ['增长驱动因素', '潜在市场', '投资机会'] },
      { title: '挑战与风险', bullets: ['技术挑战', '市场风险', '政策风险'] },
      { title: '结论建议', bullets: ['核心结论', '行动建议', '未来展望'] }
    ];

    const result = await generateContentForOutline({
      outline: defaultOutline,
      reportTitle: title,
      industry,
      scenario,
      objective,
      dataSources
    });

    return {
      body: result.content,
      metrics: {
        summary_length: result.content.length,
        risk_level: '中',
        evidence_used: []
      }
    };
  }

  // 按章节生成内容
  console.log(`开始生成报告内容，共 ${normalizedOutline.length} 个章节`);
  const result = await generateContentForOutline({
    outline: normalizedOutline,
    reportTitle: title,
    industry,
    scenario,
    objective,
    dataSources
  });

  console.log(`报告内容生成完成，总长度: ${result.content.length} 字符`);

  // 计算 metrics
  const totalLength = result.content.length;
  const sectionCount = result.sections ? result.sections.length : normalizedOutline.length;
  const mergedMetrics = {
    summary_length: totalLength,
    risk_level: '中',
    evidence_used: [`共生成 ${sectionCount} 个章节`]
  };

  return {
    body: result.content,
    metrics: mergedMetrics
  };
}

// 规范化大纲结构用于生成（处理新旧格式）
function normalizeOutlineForGeneration(outline) {
  if (!Array.isArray(outline)) return [];

  return outline.map(item => {
    // 如果是旧格式 {title, bullets}
    if (item.title && item.bullets) {
      return {
        title: item.title,
        bullets: Array.isArray(item.bullets) ? item.bullets : [],
        children: []
      };
    }

    // 如果是新格式 {title, level, children}
    if (item.title) {
      return {
        title: item.title,
        bullets: item.bullets || [],
        children: item.children && Array.isArray(item.children)
          ? normalizeOutlineForGeneration(item.children)
          : []
      };
    }

    return null;
  }).filter(Boolean);
}

// 获取当前用户的报告列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const reports = await executeQuery(
      `SELECT id, title, industry, scenario, status, highlights, metrics, content, created_at, updated_at 
       FROM industry_reports 
       WHERE user_id = ? 
       ORDER BY updated_at DESC`,
      [req.user.userId]
    );

    const normalized = reports.map((item) => ({
      ...item,
      highlights: safeJSONParse(item.highlights, []),
      metrics: safeJSONParse(item.metrics, {}),
      // content 字段用于前端计算字数和导出，返回完整内容
      content: item.content || null
    }));

    res.json({ reports: normalized });
  } catch (error) {
    console.error('获取报告列表失败', error);
    res.status(500).json({ error: '获取报告列表失败' });
  }
});

// 获取单个报告详情及对话
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查用户是否为管理员
    const users = await executeQuery(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    const isAdmin = users.length > 0 && users[0].role === 'admin';

    // 管理员可以查看所有报告，普通用户只能查看自己的报告
    let reports;
    if (isAdmin) {
      reports = await executeQuery(
        `SELECT * FROM industry_reports WHERE id = ?`,
        [id]
      );
    } else {
      reports = await executeQuery(
        `SELECT * FROM industry_reports WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
    }

    if (reports.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const conversations = await executeQuery(
      `SELECT id, role, message, created_at FROM report_conversations 
       WHERE report_id = ? ORDER BY created_at ASC`,
      [id]
    );

    // 调试日志：检查数据库中的原始数据
    console.log('从数据库读取的原始 outline:', reports[0].outline);
    console.log('从数据库读取的原始 highlights:', reports[0].highlights);

    const parsedOutline = safeJSONParse(reports[0].outline, []);
    const parsedHighlights = safeJSONParse(reports[0].highlights, []);
    const parsedMetrics = safeJSONParse(reports[0].metrics, {});

    console.log('解析后的 outline:', JSON.stringify(parsedOutline, null, 2));
    console.log('解析后的 highlights:', JSON.stringify(parsedHighlights, null, 2));

    const report = ensureOutlineNotEmpty({
      ...reports[0],
      outline: parsedOutline,
      highlights: parsedHighlights,
      metrics: parsedMetrics,
    });

    console.log('ensureOutlineNotEmpty 处理后的 outline:', JSON.stringify(report.outline, null, 2));

    res.json({
      ...report,
      data_sources: safeJSONParse(report.data_sources, []),
      outline: report.outline,
      highlights: report.highlights,
      metrics: report.metrics,
      conversations,
    });
  } catch (error) {
    console.error('获取报告详情失败', error);
    res.status(500).json({ error: '获取报告详情失败' });
  }
});

// 更新/保存自定义大纲
router.put('/:id/outline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { outline = [], highlights = [] } = req.body;

    const reports = await executeQuery(
      `SELECT id FROM industry_reports WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    if (reports.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const safeOutline = Array.isArray(outline) ? outline : [];
    const safeHighlights = Array.isArray(highlights) ? highlights : [];

    await executeQuery(
      `UPDATE industry_reports SET outline = ?, highlights = ?, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(safeOutline), JSON.stringify(safeHighlights), id]
    );

    res.json({
      success: true,
      outline: ensureOutlineNotEmpty({ outline: safeOutline, highlights: safeHighlights }).outline,
      highlights: ensureOutlineNotEmpty({ outline: safeOutline, highlights: safeHighlights }).highlights,
    });
  } catch (error) {
    console.error('保存大纲失败', error);
    res.status(500).json({ error: '保存大纲失败' });
  }
});

// AI润色大纲
router.post('/:id/outline/polish', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { outline = [] } = req.body;

    const reports = await executeQuery(
      `SELECT id, title, industry, scenario, objective FROM industry_reports WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    if (reports.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const printableOutline = (outline || []).map((item, idx) => `${idx + 1}. ${item.title || '未命名'}：${(item.bullets || []).join('；')}`).join('\n');
    const prompt = `
请优化下面的大纲，使其更精炼可执行，保持5-7个章节，每节3-5个要点。

要求：
1. 输出必须是有效的 JSON 格式
2. JSON 结构：{"outline": [{"title": "章节标题", "bullets": ["要点1", "要点2"]}], "highlights": ["亮点1", "亮点2"]}
3. outline 数组包含 5-7 个章节，每个章节有 3-5 个要点
4. highlights 数组包含 3-5 条摘要亮点

报告信息：
- 报告标题: ${reports[0].title}
- 行业: ${reports[0].industry}
- 场景: ${reports[0].scenario || '未指定'}
- 目标: ${reports[0].objective || '未指定'}

当前大纲:
${printableOutline}

请直接输出 JSON，不要包含其他说明文字。
    `.trim();

    const { content } = await callLLM(prompt, {
      system: '你是一个专业的产业研究员。请严格按照要求输出 JSON 格式，不要添加任何解释性文字。',
      maxTokens: 1200
    });

    const parsed = extractJSONFromText(content);
    const result = ensureOutlineNotEmpty(parsed || {});

    res.json({
      success: true,
      outline: result.outline,
      highlights: result.highlights,
    });
  } catch (error) {
    console.error('润色大纲失败', error);
    res.status(500).json({ error: '润色大纲失败' });
  }
});

// 创建报告并生成大纲
router.post('/', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    // 从 FormData 或 JSON 中获取数据
    const { title, industry, scenario, objective } = req.body;
    const files = req.files || [];

    if (!title || !industry) {
      return res.status(400).json({ error: '标题与行业为必填项' });
    }

    // 处理文件信息：将文件元数据保存到 data_sources
    const dataSources = files.map(file => ({
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadedAt: new Date().toISOString()
    }));

    // 如果有文件，记录日志
    if (files.length > 0) {
      console.log('收到上传的文件:', files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })));
    }

    const result = await executeQuery(
      `INSERT INTO industry_reports (user_id, title, industry, scenario, objective, data_sources, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, title, industry, scenario || null, objective || null, JSON.stringify(dataSources), 'drafting']
    );

    const reportId = result.insertId;

    // buildOutlinePayload 已经处理了数据验证和 fallback，不需要再次调用 ensureOutlineNotEmpty
    // 将文件信息转换为字符串数组传递给 AI（用于生成大纲时的上下文）
    const dataSourceNames = dataSources.length > 0 ? dataSources.map(ds => ds.name) : [];
    const outlinePayload = await buildOutlinePayload({ title, industry, scenario, objective, dataSources: dataSourceNames });

    console.log('准备保存的大纲数据:', JSON.stringify(outlinePayload, null, 2)); // 调试日志

    await executeQuery(
      `UPDATE industry_reports 
       SET outline = ?, highlights = ?, metrics = ?, status = ? 
       WHERE id = ?`,
      [
        JSON.stringify(outlinePayload.outline || []),
        JSON.stringify(outlinePayload.highlights || []),
        JSON.stringify(outlinePayload.metrics || {}),
        'draft',
        reportId,
      ]
    );

    console.log('大纲数据已保存到数据库'); // 调试日志

    res.status(201).json({
      message: '报告创建成功，已生成初步大纲',
      reportId,
      outline: outlinePayload.outline || [],
      highlights: outlinePayload.highlights || [],
      metrics: outlinePayload.metrics || {},
    });
  } catch (error) {
    console.error('创建报告失败', error);
    res.status(500).json({ error: '创建报告失败' });
  }
});

// 生成完整报告
router.post('/:id/generate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const reports = await executeQuery(
      `SELECT * FROM industry_reports WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = ensureOutlineNotEmpty({
      ...reports[0],
      outline: safeJSONParse(reports[0].outline, []),
      highlights: safeJSONParse(reports[0].highlights, []),
      metrics: safeJSONParse(reports[0].metrics, {}),
    });
    const outline = report.outline;
    await executeQuery(`UPDATE industry_reports SET status = 'generating' WHERE id = ?`, [id]);

    const generated = await buildReportContent({
      title: report.title,
      industry: report.industry,
      scenario: report.scenario,
      objective: report.objective,
      outline,
      dataSources: safeJSONParse(report.data_sources, []),
    });

    await executeQuery(
      `UPDATE industry_reports 
       SET content = ?, status = 'completed', metrics = ?, updated_at = NOW() 
       WHERE id = ?`,
      [generated.body, JSON.stringify(generated.metrics), id]
    );

    res.json({
      success: true,
      message: '报告生成完成',
      content: generated.body,
      metrics: generated.metrics,
    });
  } catch (error) {
    console.error('生成报告失败', error);
    await executeQuery(`UPDATE industry_reports SET status = 'failed' WHERE id = ?`, [req.params.id]);
    res.status(500).json({ error: '生成报告失败' });
  }
});

// 更新报告内容
router.put('/:id/content', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { content } = req.body;

    const reports = await executeQuery(
      `SELECT id FROM industry_reports WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    await executeQuery(
      `UPDATE industry_reports SET content = ?, updated_at = NOW() WHERE id = ?`,
      [content, id]
    );

    res.json({ success: true, message: '报告内容已更新' });
  } catch (error) {
    console.error('更新报告内容失败', error);
    res.status(500).json({ error: '更新报告内容失败' });
  }
});

// 更新报告基本信息
router.put('/:id/info', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, industry, scenario } = req.body;

    if (!title || !industry) {
      return res.status(400).json({ error: '标题与行业为必填项' });
    }

    // 检查报告是否存在且属于当前用户
    const reports = await executeQuery(
      `SELECT * FROM industry_reports WHERE id = ? AND user_id = ?`,
      [id, req.user.userId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: '报告不存在或无权限修改' });
    }

    // 更新报告信息
    await executeQuery(
      `UPDATE industry_reports 
       SET title = ?, industry = ?, scenario = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [title, industry, scenario || null, id, req.user.userId]
    );

    res.json({ message: '报告信息更新成功' });
  } catch (error) {
    console.error('更新报告信息失败', error);
    res.status(500).json({ error: '更新报告信息失败' });
  }
});

// 删除报告
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查报告是否存在且属于当前用户
    const reports = await executeQuery(
      `SELECT * FROM industry_reports WHERE id = ? AND user_id = ?`,
      [id, req.user.userId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: '报告不存在或无权限删除' });
    }

    // 删除报告（外键约束会自动删除关联的对话记录）
    await executeQuery(
      `DELETE FROM industry_reports WHERE id = ? AND user_id = ?`,
      [id, req.user.userId]
    );

    res.json({ message: '报告删除成功' });
  } catch (error) {
    console.error('删除报告失败', error);
    res.status(500).json({ error: '删除报告失败' });
  }
});

// 多轮对话
router.post('/:id/chat', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const files = req.files || []; // 支持文件上传（使用 multer 中间件，如果未配置则为空数组）

    if (!message || !message.trim()) {
      return res.status(400).json({ error: '问题不能为空' });
    }

    // 记录上传的文件信息（即使不处理，也记录日志）
    if (files && files.length > 0) {
      console.log('收到上传的文件:', files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })));
    }

    const reports = await executeQuery(
      `SELECT * FROM industry_reports WHERE id = ? AND user_id = ?`,
      [id, req.user.userId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    // 写入用户消息
    const userMsg = await executeQuery(
      `INSERT INTO report_conversations (report_id, user_id, role, message) VALUES (?, ?, 'user', ?)`,
      [id, req.user.userId, message.trim()]
    );

    const history = await executeQuery(
      `SELECT role, message FROM report_conversations WHERE report_id = ? ORDER BY created_at DESC LIMIT 8`,
      [id]
    );

    const stitchedHistory = history
      .reverse()
      .map((item) => `${item.role === 'assistant' ? '助手' : '用户'}: ${item.message}`)
      .join('\n');

    // 检查消息中是否包含选中文本的上下文
    const hasSelectedText = message.includes('针对以下内容：') || message.includes('"');

    let prompt = `
你正在协助完成产业报告《${reports[0].title}》。

报告上下文：
${reports[0].content ? reports[0].content.slice(0, 1000) : '正文暂无'}

最近对话：
${stitchedHistory}

用户最新问题：${message}
    `.trim();

    // 如果用户选中了文本，要求返回可以直接替换的内容
    if (hasSelectedText) {
      prompt += `

重要：用户选中了报告中的特定文本，请直接返回优化后的内容，可以直接替换原文本。保持格式和风格一致。
      `.trim();
    } else {
      prompt += `

请用中文简洁回答，给出3-5条要点，必要时列出可追加的数据需求。
      `.trim();
    }

    const { content } = await callLLM(prompt, { maxTokens: 800 });

    // 清理返回的内容：移除代码块标记
    let cleanedContent = content.trim();

    // 移除开头的 markdown 代码块标记
    cleanedContent = cleanedContent.replace(/^```(?:json|markdown)?\s*\n?/i, '');
    cleanedContent = cleanedContent.replace(/^```\s*\n?/i, '');

    // 移除结尾的代码块标记
    cleanedContent = cleanedContent.replace(/\n?```\s*$/i, '');

    // 清理多余的空白行
    cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n').trim();

    const assistantMsg = await executeQuery(
      `INSERT INTO report_conversations (report_id, user_id, role, message) VALUES (?, ?, 'assistant', ?)`,
      [id, req.user.userId, cleanedContent]
    );

    res.status(201).json({
      success: true,
      messageId: assistantMsg.insertId,
      reply: cleanedContent,
      userMessageId: userMsg.insertId,
    });
  } catch (error) {
    console.error('对话失败', error);
    // 提供更详细的错误信息
    const errorMessage = error.message || '对话失败，请稍后重试';
    console.error('错误详情:', errorMessage);

    // 如果是 API Key 相关错误，提供更明确的提示
    if (errorMessage.includes('SILICONFLOW_API_KEY')) {
      res.status(500).json({ error: 'AI 服务配置错误，请检查 API Key 配置' });
    } else if (error.response) {
      // 如果是 API 调用错误，返回更详细的信息
      res.status(500).json({ error: `AI 服务调用失败: ${error.response.status} ${error.response.statusText}` });
    } else {
      res.status(500).json({ error: errorMessage });
    }
  }
});

export default router;

