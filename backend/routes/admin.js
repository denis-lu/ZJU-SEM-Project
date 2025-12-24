import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// 所有管理员路由都需要认证和管理员权限
router.use(authenticateToken);
router.use(requireAdmin);

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    // 总用户数
    const totalUsersResult = await executeQuery('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersResult[0]?.count || 0;

    // 总报告数
    const totalReportsResult = await executeQuery('SELECT COUNT(*) as count FROM industry_reports');
    const totalReports = totalReportsResult[0]?.count || 0;

    // 总对话数
    const totalConversationsResult = await executeQuery('SELECT COUNT(*) as count FROM report_conversations');
    const totalConversations = totalConversationsResult[0]?.count || 0;

    // 已完成报告数
    const completedReportsResult = await executeQuery(
      "SELECT COUNT(*) as count FROM industry_reports WHERE status = 'completed'"
    );
    const completedReports = completedReportsResult[0]?.count || 0;

    // 今日新增用户
    const newUsersTodayResult = await executeQuery(
      "SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()"
    );
    const newUsersToday = newUsersTodayResult[0]?.count || 0;

    // 本周新增用户
    const newUsersThisWeekResult = await executeQuery(
      "SELECT COUNT(*) as count FROM users WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)"
    );
    const newUsersThisWeek = newUsersThisWeekResult[0]?.count || 0;

    // 本月新增用户
    const newUsersThisMonthResult = await executeQuery(
      "SELECT COUNT(*) as count FROM users WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"
    );
    const newUsersThisMonth = newUsersThisMonthResult[0]?.count || 0;

    // 今日创建报告
    const newReportsTodayResult = await executeQuery(
      "SELECT COUNT(*) as count FROM industry_reports WHERE DATE(created_at) = CURDATE()"
    );
    const newReportsToday = newReportsTodayResult[0]?.count || 0;

    // 本周创建报告
    const newReportsThisWeekResult = await executeQuery(
      "SELECT COUNT(*) as count FROM industry_reports WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)"
    );
    const newReportsThisWeek = newReportsThisWeekResult[0]?.count || 0;

    // 本月创建报告
    const newReportsThisMonthResult = await executeQuery(
      "SELECT COUNT(*) as count FROM industry_reports WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"
    );
    const newReportsThisMonth = newReportsThisMonthResult[0]?.count || 0;

    // 报告状态分布
    const reportsByStatusResult = await executeQuery(
      "SELECT status, COUNT(*) as count FROM industry_reports GROUP BY status"
    );
    const reportsByStatus = {};
    reportsByStatusResult.forEach(item => {
      reportsByStatus[item.status] = item.count;
    });

    res.json({
      totalUsers,
      totalReports,
      totalConversations,
      completedReports,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      newReportsToday,
      newReportsThisWeek,
      newReportsThisMonth,
      reportsByStatus
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 获取所有用户列表
router.get('/users', async (req, res) => {
  try {
    const users = await executeQuery(
      'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(400).json({ error: '无效的用户ID' });
    }

    // 检查用户是否存在
    const users = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 删除用户（由于外键约束，会级联删除相关数据）
    await executeQuery('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// 获取所有报告列表
router.get('/reports', async (req, res) => {
  try {
    const reports = await executeQuery(
      `SELECT id, user_id, title, industry, scenario, status, created_at, updated_at 
       FROM industry_reports 
       ORDER BY created_at DESC`
    );
    res.json(reports);
  } catch (error) {
    console.error('获取报告列表失败:', error);
    res.status(500).json({ error: '获取报告列表失败' });
  }
});

// 删除报告
router.delete('/reports/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    
    if (!reportId) {
      return res.status(400).json({ error: '无效的报告ID' });
    }

    // 检查报告是否存在
    const reports = await executeQuery('SELECT id FROM industry_reports WHERE id = ?', [reportId]);
    if (reports.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    // 删除报告（由于外键约束，会级联删除相关对话）
    await executeQuery('DELETE FROM industry_reports WHERE id = ?', [reportId]);

    res.json({ message: '报告删除成功' });
  } catch (error) {
    console.error('删除报告失败:', error);
    res.status(500).json({ error: '删除报告失败' });
  }
});

export default router;

