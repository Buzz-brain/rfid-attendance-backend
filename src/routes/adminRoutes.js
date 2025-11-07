const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Overview statistics (Admin and Lecturer)
router.get('/dashboard/overview', authMiddleware, roleMiddleware('admin', 'lecturer'), adminController.getOverview);

// Export attendance report (Admin and Lecturer)
router.get('/reports/export', authMiddleware, roleMiddleware('admin', 'lecturer'), adminController.exportReport);

// System activity logs (Admin only)
router.get('/activity', authMiddleware, roleMiddleware('admin'), adminController.getActivityLogs);

// Audit logs (Admin only)
router.get('/audit-logs', authMiddleware, roleMiddleware('admin'), adminController.getAuditLogs);
// PDF export (Admin and Lecturer)
router.get('/reports/export-pdf', authMiddleware, roleMiddleware('admin', 'lecturer'), adminController.exportReportPDF);
// User management (Admin only)
router.get('/users', authMiddleware, roleMiddleware('admin'), adminController.getUsers);
router.post('/users', authMiddleware, roleMiddleware('admin'), adminController.createUser);
router.put('/users/:id', authMiddleware, roleMiddleware('admin'), adminController.updateUser);
router.delete('/users/:id', authMiddleware, roleMiddleware('admin'), adminController.deleteUser);

module.exports = router;