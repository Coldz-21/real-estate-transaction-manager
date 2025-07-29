const express = require('express');
const router = express.Router();
const loopController = require('../controllers/loopController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Loop CRUD operations
router.get('/', loopController.getLoops);
router.post('/', loopController.createLoop);
router.get('/stats', loopController.getDashboardStats);
router.get('/closing', loopController.getClosingLoops);
router.get('/export/csv', loopController.exportCSV);
router.get('/:id', loopController.getLoopById);
router.put('/:id', loopController.updateLoop);
router.get('/:id/export/pdf', loopController.exportPDF);

// Admin only routes
router.delete('/:id', adminMiddleware, loopController.deleteLoop);
router.put('/:id/archive', adminMiddleware, loopController.archiveLoop);

module.exports = router;
