const express = require('express');
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Create new student (Admin only)
router.post(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('regNo').notEmpty().withMessage('Registration number is required'),
        body('department').notEmpty().withMessage('Department is required'),
        body('level').notEmpty().withMessage('Level is required'),
        body('rfidTag').notEmpty().withMessage('RFID tag is required')
    ],
    studentController.createStudent
);

// Get all students (Admin/Lecturer)
router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    studentController.getAllStudents
);

// Get student by ID (Admin/Lecturer)
router.get(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    studentController.getStudentById
);

// Update student (Admin only)
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('admin'),
    [
        body('name').optional().notEmpty().withMessage('Name is required'),
        body('regNo').optional().notEmpty().withMessage('Registration number is required'),
        body('department').optional().notEmpty().withMessage('Department is required'),
        body('level').optional().notEmpty().withMessage('Level is required'),
        body('rfidTag').optional().notEmpty().withMessage('RFID tag is required')
    ],
    studentController.updateStudent
);

// Delete student (Admin only)
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('admin'),
    studentController.deleteStudent
);

module.exports = router;