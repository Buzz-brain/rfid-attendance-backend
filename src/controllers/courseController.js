const Course = require('../models/Course');
const { validationResult } = require('express-validator');

// @route   POST /api/courses
// @desc    Create a new course
// @access  Admin/Lecturer
exports.createCourse = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    try {
        const { courseCode, courseTitle, lecturer, department, level } = req.body;
        let course = await Course.findOne({ courseCode });
        if (course) {
            return res.status(400).json({ success: false, message: 'Course with this code already exists' });
        }
        course = new Course({ courseCode, courseTitle, lecturer, department, level });
        await course.save();
        res.status(201).json({ success: true, message: 'Course created successfully', data: course });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/courses
// @desc    Get all courses
// @access  Admin/Lecturer
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('lecturer', 'name email role');
        res.json({ success: true, message: 'Courses fetched successfully', data: courses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/courses/:id
// @desc    Get course details
// @access  Admin/Lecturer
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('lecturer', 'name email role');
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, message: 'Course fetched successfully', data: course });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Admin/Lecturer
exports.updateCourse = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, message: 'Course updated successfully', data: course });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Admin/Lecturer
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};