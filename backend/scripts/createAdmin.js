import dotenv from 'dotenv';
import { connectDatabase, executeQuery } from '../config/database.js';
import bcrypt from 'bcryptjs';

dotenv.config();

/**
 * 创建管理员用户的脚本
 * 使用方法: node backend/scripts/createAdmin.js <username> <email> <password>
 */
async function createAdmin() {
  try {
    const username = process.argv[2];
    const email = process.argv[3];
    const password = process.argv[4];

    if (!username || !email || !password) {
      console.error('❌ 请提供用户名、邮箱和密码');
      console.log('使用方法: node backend/scripts/createAdmin.js <username> <email> <password>');
      process.exit(1);
    }

    // 连接数据库
    await connectDatabase();
    console.log('✅ 数据库连接成功');

    // 检查用户是否已存在
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      console.error('❌ 用户名或邮箱已存在');
      process.exit(1);
    }

    // 加密密码
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建管理员用户
    const result = await executeQuery(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'admin']
    );

    console.log(`✅ 成功创建管理员用户:`);
    console.log(`   - 用户名: ${username}`);
    console.log(`   - 邮箱: ${email}`);
    console.log(`   - 用户ID: ${result.insertId}`);
    console.log(`   - 角色: admin`);
    process.exit(0);

  } catch (error) {
    console.error('❌ 创建管理员失败:', error);
    process.exit(1);
  }
}

createAdmin();

