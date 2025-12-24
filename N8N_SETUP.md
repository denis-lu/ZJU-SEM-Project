# n8n 自动化工作流配置指南

## 1. 安装 n8n

```bash
# 全局安装 n8n
npm install -g n8n

# 或使用 Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

## 2. 启动 n8n

```bash
# 直接启动
n8n

# 或指定端口
N8N_PORT=5678 n8n
```

访问：http://localhost:5678

## 3. 配置环境变量

在 n8n 设置中添加以下环境变量：

- `SILICONFLOW_API_KEY`: 你的 SiliconFlow API 密钥
- `BACKEND_API_URL`: 后端 API 地址 (默认: http://localhost:3000)

## 4. 导入工作流

1. 在 n8n 界面中点击 "New Workflow"
2. 点击右上角的设置图标
3. 选择 "Import from JSON"
4. 复制 `n8n-workflow.json` 文件内容并粘贴
5. 点击 "Import" 导入工作流

## 5. 配置 Webhook URL

工作流导入后，webhook 地址为：
```
http://localhost:5678/webhook/process-article
```

确保在后端 `.env` 文件中配置：
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/process-article
```

## 6. 工作流说明

### 节点功能：

1. **接收处理请求**: 接收来自后端的文章处理请求
2. **抓取网页内容**: 获取指定URL的HTML内容
3. **解析网页内容**: 使用Cheerio解析HTML，提取标题和正文
4. **更新文章基本信息**: 将提取的标题和内容保存到数据库
5. **生成文章摘要**: 调用AI API生成文章摘要
6. **提取关键词**: 调用AI API提取关键词
7. **合并AI结果**: 处理AI返回的结果
8. **保存AI处理结果**: 将AI处理结果保存到数据库
9. **返回处理结果**: 返回处理成功的响应

### 错误处理：
- 如果任何步骤失败，工作流会返回错误信息
- 支持网页抓取失败、内容解析失败、AI处理失败等场景

## 7. 测试工作流

可以通过以下方式测试：

```bash
# 使用 curl 测试 webhook
curl -X POST http://localhost:5678/webhook/process-article \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": 1,
    "url": "https://example.com/article",
    "timestamp": "2024-01-01T00:00:00Z"
  }'
```

## 8. 监控和调试

1. 在 n8n 界面中可以查看工作流执行历史
2. 点击具体的执行记录可以看到每个节点的输入输出
3. 如果有错误，错误信息会显示在相应的节点上

## 9. 高级配置

### 自定义内容提取规则
可以在"解析网页内容"节点中修改选择器来适配不同网站的结构。

### 调整AI参数
可以在AI相关节点中调整temperature、max_tokens等参数来优化生成效果。

### 添加更多AI功能
可以复制AI节点来添加更多功能，如翻译、情感分析等。

## 10. 生产环境部署

生产环境建议使用 Docker Compose：

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - WEBHOOK_URL=https://your-domain.com
    volumes:
      - ~/.n8n:/home/node/.n8n
    restart: unless-stopped
```
