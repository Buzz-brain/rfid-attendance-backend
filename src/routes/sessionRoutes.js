const express = require('express');
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Start session (lecturer only)
router.post('/start', authMiddleware, roleMiddleware('lecturer'), sessionController.startSession);
// End session (lecturer only)
router.patch('/:id/end', authMiddleware, roleMiddleware('lecturer'), sessionController.endSession);
// Get active sessions (lecturer/admin)
router.get('/active', authMiddleware, sessionController.getActiveSessions);
// Get recent sessions (lecturer/admin)
router.get('/recent', authMiddleware, sessionController.getRecentSessions);

module.exports = router;
