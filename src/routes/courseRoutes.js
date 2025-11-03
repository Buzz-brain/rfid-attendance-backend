const express = require('express');
const { body } = require('express-validator');
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Create new course (Admin/Lecturer)
router.post(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    [
        body('courseCode').notEmpty().withMessage('Course code is required'),
        body('courseTitle').notEmpty().withMessage('Course title is required'),
        body('lecturer').notEmpty().withMessage('Lecturer is required'),
        body('department').notEmpty().withMessage('Department is required'),
        body('level').notEmpty().withMessage('Level is required')
    ],
    courseController.createCourse
);

// Get all courses (Admin/Lecturer)
router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    courseController.getAllCourses
);

// Get course by ID (Admin/Lecturer)
router.get(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    courseController.getCourseById
);

// Update course (Admin/Lecturer)
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    [
        body('courseCode').optional().notEmpty().withMessage('Course code is required'),
        body('courseTitle').optional().notEmpty().withMessage('Course title is required'),
        body('lecturer').optional().notEmpty().withMessage('Lecturer is required'),
        body('department').optional().notEmpty().withMessage('Department is required'),
        body('level').optional().notEmpty().withMessage('Level is required')
    ],
    courseController.updateCourse
);

// Delete course (Admin/Lecturer)
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'lecturer'),
    courseController.deleteCourse
);

module.exports = router;