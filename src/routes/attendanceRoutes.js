const express = require('express');
const { body } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Mark attendance by RFID scan (Lecturer)
router.post(
    '/mark',
    authMiddleware,
    roleMiddleware('lecturer'),
    [
        body('rfidTag').notEmpty().withMessage('RFID tag is required'),
        body('courseId').notEmpty().withMessage('Course ID is required')
    ],
    attendanceController.markAttendance
);

// Get attendance records for a specific course (Lecturer/Admin)
router.get(
    '/course/:courseId',
    authMiddleware,
    roleMiddleware('lecturer', 'admin'),
    attendanceController.getAttendanceByCourse
);

// Get attendance history of a student (Lecturer/Admin)
router.get(
    '/student/:studentId',
    authMiddleware,
    roleMiddleware('lecturer', 'admin'),
    attendanceController.getAttendanceByStudent
);

// Get attendance records for a specific date (Admin/Lecturer)
router.get(
    '/date/:date',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    attendanceController.getAttendanceByDate
);

// Update an attendance record (Admin)
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    attendanceController.updateAttendance
);

// Delete an attendance record (Admin)
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    attendanceController.deleteAttendance
);

module.exports = router;