# 管理员权限控制使用指南

## 概述

系统已实现基于角色的权限控制（RBAC），只有具有 `admin` 角色的用户才能访问管理员页面。

## 功能特性

1. **数据库角色字段**：用户表包含 `role` 字段（ENUM: 'user', 'admin'）
2. **后端权限检查**：管理员路由使用 `requireAdmin` 中间件
3. **前端路由守卫**：自动检查管理员权限并拦截未授权访问
4. **JWT 令牌**：包含用户角色信息

## 设置管理员用户

### 方法一：将现有用户设置为管理员

```bash
# 在项目根目录执行
node backend/scripts/setAdmin.js <username>
```

示例：
```bash
node backend/scripts/setAdmin.js admin
```

### 方法二：创建新的管理员用户

```bash
# 在项目根目录执行
node backend/scripts/createAdmin.js <username> <email> <password>
```

示例：
```bash
node backend/scripts/createAdmin.js admin admin@example.com admin123
```

## 使用流程

### 1. 首次设置管理员

```bash
# 1. 确保数据库已启动
# 2. 创建管理员用户
node backend/scripts/createAdmin.js admin admin@example.com your_password

# 3. 或者将现有用户设置为管理员
node backend/scripts/setAdmin.js existing_username
```

### 2. 登录管理员账户

1. 使用管理员账户登录系统
2. 登录后，JWT 令牌会包含角色信息
3. 前端会自动识别管理员身份

### 3. 访问管理员页面

- 访问 `http://localhost:5173/admin`
- 非管理员用户会被自动重定向到首页，并显示权限不足提示

## 权限检查机制

### 后端检查

所有 `/api/admin/*` 路由都经过以下检查：
1. `authenticateToken` - 验证 JWT 令牌
2. `requireAdmin` - 验证用户角色是否为 `admin`

如果权限不足，返回 `403 Forbidden` 错误。

### 前端检查

路由守卫会自动：
1. 检查用户是否已登录
2. 检查用户角色是否为 `admin`
3. 非管理员用户会被重定向到首页

## API 端点

### 管理员专用 API（需要管理员权限）

- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/users` - 获取用户列表
- `DELETE /api/admin/users/:id` - 删除用户
- `GET /api/admin/reports` - 获取报告列表
- `DELETE /api/admin/reports/:id` - 删除报告

## 数据库结构

```sql
-- 用户表包含 role 字段
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 安全注意事项

1. **密码安全**：管理员账户应使用强密码
2. **令牌过期**：JWT 令牌默认 7 天过期
3. **权限验证**：前后端都进行权限检查，确保安全
4. **日志记录**：建议记录管理员操作日志

## 故障排除

### 问题：无法访问管理员页面

1. 检查用户角色是否为 `admin`
   ```bash
   # 在数据库中查询
   SELECT id, username, role FROM users WHERE username = 'your_username';
   ```

2. 检查 JWT 令牌是否包含角色信息
   - 登录后检查返回的 `user.role` 字段

3. 清除浏览器缓存和 localStorage
   - 重新登录以获取新的令牌

### 问题：脚本执行失败

1. 确保数据库已连接
2. 确保用户存在（对于 setAdmin）
3. 检查数据库表结构是否包含 `role` 字段

## 开发建议

1. **测试环境**：在测试环境先验证权限控制
2. **备份数据**：修改用户角色前备份数据库
3. **审计日志**：记录管理员操作，便于追踪
4. **定期审查**：定期检查管理员账户列表

