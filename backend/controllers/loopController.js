const loopModel = require('../models/loopModel');
const excelLogger = require('../utils/excelLogger');
const csvExport = require('../utils/csvExport');
const pdfGenerator = require('../utils/pdfGenerator');

const loopController = {
  createLoop: async (req, res, next) => {
    try {
      const loopData = {
        ...req.body,
        creator_id: req.user.id
      };

      // Validate required fields
      if (!loopData.type || !loopData.property_address) {
        return res.status(400).json({
          success: false,
          error: 'Type and property address are required'
        });
      }

      const result = loopModel.createLoop(loopData);

      // Log the creation
      await excelLogger.log('NEW_LOOP', {
        id: result.lastInsertRowid,
        type: loopData.type,
        creator: req.user.name,
        property_address: loopData.property_address,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Loop created successfully',
        loopId: result.lastInsertRowid
      });
    } catch (error) {
      next(error);
    }
  },

  getLoops: (req, res, next) => {
    try {
      console.log('GET /api/loops called by user:', req.user?.id, req.user?.name);
      console.log('Query params:', req.query);

      const filters = {
        status: req.query.status,
        type: req.query.type,
        search: req.query.search,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'desc',
        limit: req.query.limit ? parseInt(req.query.limit) : null
      };

      // If user is not admin, only show their loops
      if (req.user.role !== 'admin') {
        filters.creator_id = req.user.id;
      }

      console.log('Applying filters:', filters);
      const loops = loopModel.getAllLoops(filters);
      console.log('Found', loops.length, 'loops');

      const response = {
        success: true,
        loops,
        count: loops.length
      };

      console.log('Sending response:', { success: true, count: loops.length });
      res.json(response);
    } catch (error) {
      console.error('Error in getLoops:', error);
      next(error);
    }
  },

  getLoopById: (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Check if user has permission to view this loop
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        loop
      });
    } catch (error) {
      next(error);
    }
  },

  updateLoop: async (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const result = loopModel.updateLoop(id, req.body);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found or no changes made'
        });
      }

      // Log the update
      await excelLogger.log('UPDATED_LOOP', {
        id: parseInt(id),
        updater: req.user.name,
        changes: req.body,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Loop updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  deleteLoop: async (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Only admins can delete loops
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admins can delete loops'
        });
      }

      const result = loopModel.deleteLoop(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Log the deletion
      await excelLogger.log('DELETED_LOOP', {
        id: parseInt(id),
        deleter: req.user.name,
        loop_data: loop,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Loop deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  archiveLoop: async (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Only admins can archive loops
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admins can archive loops'
        });
      }

      const result = loopModel.archiveLoop(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Log the archival
      await excelLogger.log('ARCHIVED_LOOP', {
        id: parseInt(id),
        archiver: req.user.name,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Loop archived successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  exportCSV: (req, res, next) => {
    try {
      const filters = {
        status: req.query.status,
        type: req.query.type,
        search: req.query.search
      };

      // If user is not admin, only export their loops
      if (req.user.role !== 'admin') {
        filters.creator_id = req.user.id;
      }

      const loops = loopModel.getAllLoops(filters);
      const csvContent = csvExport.generateCSV(loops);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=loops.csv');
      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  },

  exportPDF: async (req, res, next) => {
    try {
      const { id } = req.params;
      const loop = loopModel.getLoopById(id);

      if (!loop) {
        return res.status(404).json({
          success: false,
          error: 'Loop not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && loop.creator_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const pdfBuffer = await pdfGenerator.generatePDF(loop);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=loop-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  },

  getClosingLoops: (req, res, next) => {
    try {
      const closingLoops = loopModel.getClosingLoops();

      res.json({
        success: true,
        loops: closingLoops,
        count: closingLoops.length
      });
    } catch (error) {
      next(error);
    }
  },

  getDashboardStats: (req, res, next) => {
    try {
      const stats = loopModel.getLoopStats();
      const closingLoops = loopModel.getClosingLoops();

      res.json({
        success: true,
        stats: {
          ...stats,
          closing_soon: closingLoops.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = loopController;
