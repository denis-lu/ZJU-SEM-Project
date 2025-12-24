import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '050228',
  database: process.env.DB_NAME || 'smartdigest',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

let pool;

export async function connectDatabase() {
  try {
    pool = mysql.createPool(dbConfig);

    // 测试连接
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();

    // 初始化数据库表
    await initializeTables();

    return pool;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return pool;
}

async function initializeTables() {
  try {
    const connection = await pool.getConnection();

    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 添加role字段（如果表已存在但没有role字段）
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'
      `);
      console.log('✅ 已添加role字段到users表');
    } catch (migrationError) {
      // 如果字段已存在，忽略错误
      if (!migrationError.message.includes('Duplicate column name')) {
        console.log('ℹ️  role字段迁移信息:', migrationError.message);
      }
    }

    // 创建文章表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        url VARCHAR(2048) NOT NULL,
        title VARCHAR(500),
        content LONGTEXT,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      )
    `);

    // 迁移现有表结构：将content字段从TEXT改为LONGTEXT
    try {
      await connection.execute(`
        ALTER TABLE articles MODIFY COLUMN content LONGTEXT
      `);
      console.log('✅ 已更新articles表content字段为LONGTEXT');
    } catch (migrationError) {
      // 如果字段已经是LONGTEXT或者表不存在，忽略错误
      if (!migrationError.message.includes('Duplicate column name') &&
        !migrationError.message.includes("doesn't exist")) {
        console.log('ℹ️  content字段迁移信息:', migrationError.message);
      }
    }

    // 创建AI处理结果表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT NOT NULL,
        summary TEXT,
        keywords JSON,
        translation TEXT,
        language VARCHAR(10) DEFAULT 'zh',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        INDEX idx_article_id (article_id)
      )
    `);

    // 创建问答对话表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT NOT NULL,
        user_id INT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_article_id (article_id),
        INDEX idx_user_id (user_id)
      )
    `);

    // 创建产业报告表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS industry_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        industry VARCHAR(120),
        scenario VARCHAR(255),
        objective TEXT,
        data_sources JSON,
        outline JSON,
        highlights JSON,
        metrics JSON,
        status ENUM('draft', 'drafting', 'generating', 'completed', 'failed') DEFAULT 'draft',
        content LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_report_user (user_id),
        INDEX idx_report_status (status)
      )
    `);

    // 创建产业报告对话表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS report_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('user', 'assistant', 'system') DEFAULT 'user',
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES industry_reports(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_report_conv_report (report_id),
        INDEX idx_report_conv_user (user_id)
      )
    `);

    // 修复外键约束：如果表已存在但外键指向错误的表，需要删除并重新创建外键
    try {
      // 检查是否存在错误的外键约束
      const [foreignKeys] = await connection.execute(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'report_conversations' 
        AND REFERENCED_TABLE_NAME = 'reports'
      `);

      if (foreignKeys.length > 0) {
        console.log('⚠️  检测到错误的外键约束，正在修复...');

        // 删除错误的外键约束
        for (const fk of foreignKeys) {
          try {
            await connection.execute(`
              ALTER TABLE report_conversations 
              DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
            `);
            console.log(`✅ 已删除错误的外键约束: ${fk.CONSTRAINT_NAME}`);
          } catch (dropError) {
            console.log(`ℹ️  删除外键约束时: ${dropError.message}`);
          }
        }

        // 添加正确的外键约束
        try {
          await connection.execute(`
            ALTER TABLE report_conversations 
            ADD CONSTRAINT fk_report_conversations_report_id 
            FOREIGN KEY (report_id) REFERENCES industry_reports(id) ON DELETE CASCADE
          `);
          console.log('✅ 已添加正确的外键约束');
        } catch (addError) {
          // 如果外键已存在，忽略错误
          if (!addError.message.includes('Duplicate foreign key')) {
            console.log(`ℹ️  添加外键约束时: ${addError.message}`);
          }
        }
      }
    } catch (fixError) {
      // 如果修复过程中出错，记录但不影响主流程
      console.log(`ℹ️  外键约束修复信息: ${fixError.message}`);
    }

    connection.release();
    console.log('✅ 数据库表初始化完成');

  } catch (error) {
    console.error('❌ 数据库表初始化失败:', error);
    throw error;
  }
}

export async function executeQuery(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
