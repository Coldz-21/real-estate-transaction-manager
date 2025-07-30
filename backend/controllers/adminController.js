const userModel = require('../models/userModel');
const ActivityLogger = require('../services/activityLogger');
const bcrypt = require('bcryptjs');

const adminController = {
  // User Management
  getAllUsers: (req, res, next) => {
    try {
      const users = userModel.getAllUsers();
      
      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }))
      });
    } catch (error) {
      next(error);
    }
  },

  getUserActivitySummary: (req, res, next) => {
    try {
      const summary = ActivityLogger.getUserActivitySummary();
      
      res.json({
        success: true,
        userActivity: summary
      });
    } catch (error) {
      next(error);
    }
  },

  // Activity Logs
  getActivityLogs: (req, res, next) => {
    try {
      const filters = {
        userId: req.query.userId ? parseInt(req.query.userId) : null,
        actionType: req.query.actionType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
        limit: req.query.limit ? parseInt(req.query.limit) : 100
      };

      const logs = ActivityLogger.getActivityLogs(filters);
      const stats = ActivityLogger.getActivityStats();

      res.json({
        success: true,
        logs,
        stats,
        count: logs.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Password Management
  changeUserPassword: async (req, res, next) => {
    try {
      const { userId, newPassword } = req.body;
      const targetUserId = userId || req.user.id; // Allow changing own password if no userId specified

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      // If changing another user's password, must be admin
      if (userId && userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admins can change other users passwords'
        });
      }

      // Get target user
      const targetUser = userModel.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const result = userModel.updatePassword(targetUserId, hashedPassword);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to update password'
        });
      }

      // Log password change activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.PASSWORD_CHANGED,
        targetUserId === req.user.id 
          ? 'Changed own password' 
          : `Changed password for user: ${targetUser.name}`,
        req,
        { targetUserId, targetUserName: targetUser.name }
      );

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // User Suspension Management
  suspendUser: async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Get target user
      const targetUser = userModel.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Can't suspend another admin
      if (targetUser.role === 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Cannot suspend another administrator'
        });
      }

      // Can't suspend yourself
      if (parseInt(userId) === req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Cannot suspend your own account'
        });
      }

      // Suspend the user
      const result = userModel.suspendUser(userId);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to suspend user'
        });
      }

      // Log suspension activity
      ActivityLogger.log(
        req.user.id,
        'USER_SUSPENDED',
        `Suspended user: ${targetUser.name} (${targetUser.email})`,
        req,
        { targetUserId: parseInt(userId), targetUserName: targetUser.name, targetUserEmail: targetUser.email }
      );

      res.json({
        success: true,
        message: `User ${targetUser.name} has been suspended`
      });
    } catch (error) {
      next(error);
    }
  },

  unsuspendUser: async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Get target user
      const targetUser = userModel.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Unsuspend the user
      const result = userModel.unsuspendUser(userId);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Failed to unsuspend user'
        });
      }

      // Log unsuspension activity
      ActivityLogger.log(
        req.user.id,
        'USER_UNSUSPENDED',
        `Unsuspended user: ${targetUser.name} (${targetUser.email})`,
        req,
        { targetUserId: parseInt(userId), targetUserName: targetUser.name, targetUserEmail: targetUser.email }
      );

      res.json({
        success: true,
        message: `User ${targetUser.name} has been unsuspended`
      });
    } catch (error) {
      next(error);
    }
  },

  // Export Functions
  exportActivityLogs: (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const filters = {
        userId: req.query.userId ? parseInt(req.query.userId) : null,
        actionType: req.query.actionType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search
      };

      const logs = ActivityLogger.getActivityLogs(filters);

      // Log export activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.EXPORT_DATA,
        `Exported activity logs as ${format.toUpperCase()}`,
        req,
        { format, filters, recordCount: logs.length }
      );

      if (format === 'csv') {
        const csvContent = generateActivityLogsCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=activity-logs.csv');
        res.send(csvContent);
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported export format'
        });
      }
    } catch (error) {
      next(error);
    }
  },

  exportUserList: (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const users = userModel.getAllUsers();

      // Log export activity
      ActivityLogger.log(
        req.user.id,
        ActivityLogger.ACTION_TYPES.EXPORT_DATA,
        `Exported user list as ${format.toUpperCase()}`,
        req,
        { format, recordCount: users.length }
      );

      if (format === 'csv') {
        const csvContent = generateUserListCSV(users);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=user-list.csv');
        res.send(csvContent);
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported export format'
        });
      }
    } catch (error) {
      next(error);
    }
  }
};

// Helper function to generate CSV for activity logs
function generateActivityLogsCSV(logs) {
  const headers = [
    'ID',
    'User Name',
    'User Email',
    'Action Type',
    'Description',
    'IP Address',
    'Date/Time'
  ];

  const rows = logs.map(log => [
    log.id,
    log.user_name || 'Unknown',
    log.user_email || 'Unknown',
    log.action_type,
    log.description,
    log.ip_address || 'N/A',
    new Date(log.created_at).toLocaleString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

// Helper function to generate CSV for user list
function generateUserListCSV(users) {
  const headers = [
    'ID',
    'Name',
    'Email',
    'Role',
    'Created Date',
    'Last Updated'
  ];

  const rows = users.map(user => [
    user.id,
    user.name,
    user.email,
    user.role,
    new Date(user.created_at).toLocaleString(),
    new Date(user.updated_at).toLocaleString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

module.exports = adminController;
