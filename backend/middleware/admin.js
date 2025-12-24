import { executeQuery } from '../config/database.js';

/**
 * 管理员权限检查中间件
 * 确保只有管理员角色的用户才能访问
 */
export async function requireAdmin(req, res, next) {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: '未认证的用户' });
    }

    // 从数据库查询用户角色
    const users = await executeQuery(
      'SELECT id, username, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = users[0];

    // 检查是否为管理员
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '权限不足，需要管理员权限' });
    }

    // 将用户信息附加到请求对象
    req.user.role = user.role;
    req.user.username = user.username;
    
    next();
  } catch (error) {
    console.error('管理员权限检查失败:', error);
    res.status(500).json({ error: '权限检查失败' });
  }
}

