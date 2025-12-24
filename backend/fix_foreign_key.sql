-- 修复 report_conversations 表的外键约束
-- 如果外键指向错误的表名 'reports'，需要删除并重新创建

-- 1. 查找错误的外键约束
SELECT CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'report_conversations'
    AND REFERENCED_TABLE_NAME = 'reports';

-- 2. 删除错误的外键约束（替换 CONSTRAINT_NAME 为实际的外键名称）
-- ALTER TABLE report_conversations DROP FOREIGN KEY report_conversations_ibfk_1;

-- 3. 添加正确的外键约束
-- ALTER TABLE report_conversations
-- ADD CONSTRAINT fk_report_conversations_report_id
-- FOREIGN KEY (report_id) REFERENCES industry_reports(id) ON DELETE CASCADE;

-- 或者，如果表是空的，可以直接删除并重新创建：
-- DROP TABLE IF EXISTS report_conversations;
-- CREATE TABLE report_conversations (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   report_id INT NOT NULL,
--   user_id INT NOT NULL,
--   role ENUM('user', 'assistant', 'system') DEFAULT 'user',
--   message TEXT NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (report_id) REFERENCES industry_reports(id) ON DELETE CASCADE,
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--   INDEX idx_report_conv_report (report_id),
--   INDEX idx_report_conv_user (user_id)
-- );