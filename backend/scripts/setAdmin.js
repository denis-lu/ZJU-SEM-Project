import dotenv from 'dotenv';
import { connectDatabase, executeQuery } from '../config/database.js';
import bcrypt from 'bcryptjs';

dotenv.config();

/**
 * 设置用户为管理员的脚本
 * 使用方法: node backend/scripts/setAdmin.js <username>
 */
async function setAdmin() {
  try {
    const username = process.argv[2];

    if (!username) {
      console.error('❌ 请提供用户名');
      console.log('使用方法: node backend/scripts/setAdmin.js <username>');
      process.exit(1);
    }

    // 连接数据库
    await connectDatabase();
    console.log('✅ 数据库连接成功');

    // 查找用户
    const users = await executeQuery(
      'SELECT id, username, email, role FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      console.error(`❌ 用户 "${username}" 不存在`);
      process.exit(1);
    }

    const user = users[0];

    // 检查是否已经是管理员
    if (user.role === 'admin') {
      console.log(`ℹ️  用户 "${username}" 已经是管理员`);
      process.exit(0);
    }

    // 更新用户角色为管理员
    await executeQuery(
      'UPDATE users SET role = ? WHERE id = ?',
      ['admin', user.id]
    );

    console.log(`✅ 成功将用户 "${username}" (ID: ${user.id}, Email: ${user.email}) 设置为管理员`);
    process.exit(0);

  } catch (error) {
    console.error('❌ 设置管理员失败:', error);
    process.exit(1);
  }
}

setAdmin();

