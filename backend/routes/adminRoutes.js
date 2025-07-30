const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/activity', adminController.getUserActivitySummary);

// Activity Logs
router.get('/activity-logs', adminController.getActivityLogs);

// Password Management
router.put('/change-password', adminController.changeUserPassword);

// User Suspension Management
router.put('/users/:userId/suspend', adminController.suspendUser);
router.put('/users/:userId/unsuspend', adminController.unsuspendUser);

// Export Functions
router.get('/export/activity-logs', adminController.exportActivityLogs);
router.get('/export/users', adminController.exportUserList);

module.exports = router;
